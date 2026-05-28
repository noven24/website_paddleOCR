import os
import uuid
import json
import traceback
from flask import Flask, request, jsonify
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Initialize Gemini Client
gemini_client = None
if os.environ.get("GEMINI_API_KEY"):
    try:
        gemini_client = genai.Client()
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")


# Set thread environment SEBELUM import paddle apapun
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
# Matikan Intel oneDNN untuk mencegah error 'could not execute a primitive'
# Error ini muncul karena CPU server HF tidak mendukung semua instruksi AVX/oneDNN
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['FLAGS_mkldnn_cache_capacity'] = '0'
os.environ['DNNL_DEFAULT_FPMATH_MODE'] = 'F32'
os.environ['FLAGS_enable_pir_api'] = '0' # Nonaktifkan PIR di PaddlePaddle 3.x


# 1. IMPORT DAN INISIALISASI PADDLEOCR v2.7.3
from paddleocr import PaddleOCR
from PIL import Image as PILImage

ocr_model = PaddleOCR(
    use_textline_orientation=True,
    lang='en',
    use_mkldnn=False,
    enable_mkldnn=False
)

app = Flask(__name__)
CORS(app)

# 2. HALAMAN DEPAN
@app.route('/')
def home():
    return """
    <html>
        <body style="background-color:#0d0d1a; color:#00ff88; font-family:monospace; text-align:center; padding-top:20%;">
            <h1>&#10003; Visionary OCR API is Online!</h1>
            <p>Engine: <b>PaddleOCR v2.7.3</b> &mdash; Ready to accept POST requests at <code>/ocr</code></p>
        </body>
    </html>
    """

# 3. FUNGSI PREPROCESSING GAMBAR
def preprocess_image(input_path, output_path):
    """
    Preprocessing penting sebelum OCR:
    - Konversi RGBA/mode lain ke RGB (PaddleOCR tidak bisa baca alpha channel)
    - Resize jika resolusi terlalu besar (> 2000px) agar OCR tidak gagal diam-diam
    - Simpan sebagai PNG bersih tanpa metadata aneh
    """
    try:
        img = PILImage.open(input_path)

        # Konversi ke RGB - ini fix utama untuk PNG dengan transparency
        if img.mode != 'RGB':
            # Buat background putih untuk gambar dengan alpha channel
            background = PILImage.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])  # Gunakan alpha sebagai mask
            else:
                background.paste(img)
            img = background

        # Resize jika dimensi terlalu besar untuk menghemat memori (RAM)
        MAX_DIM = 1000
        width, height = img.size
        if max(width, height) > MAX_DIM:
            ratio = MAX_DIM / max(width, height)
            new_w = int(width * ratio)
            new_h = int(height * ratio)
            img = img.resize((new_w, new_h), PILImage.LANCZOS)

        # Simpan gambar yang sudah diproses
        img.save(output_path, 'PNG', optimize=False)
        
        # Bersihkan memori image
        img.close()
        return True

    except Exception as e:
        print(f"[Preprocessing Error] {str(e)}")
        return False

# 4. FUNGSI EKSTRAKSI PADDLEOCR
def proses_ocr_untuk_api(image_path):
    global ocr_model
    try:
        # PaddleOCR v2.7.x menggunakan metode .ocr()
        result = ocr_model.ocr(image_path)

        # Cek apakah hasilnya kosong
        if not result or result == [None] or not result[0]:
            return {
                "status": "success",
                "message": "Tidak ada teks yang ditemukan",
                "total_text": 0,
                "data": []
            }

        res = result[0]
        ekstraksi_data = []

        # Format output PaddleOCR v2.7.x: [box, (text, score)]
        for line in res:
            if line is None:
                continue
            box = line[0]       # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            text = line[1][0]   # string teks
            score = line[1][1]  # float akurasi

            formatted_box = [[int(p[0]), int(p[1])] for p in box]

            item = {
                "text": str(text),
                "confidence_score": round(float(score), 4),
                "box_coordinates": formatted_box
            }
            ekstraksi_data.append(item)

        return {
            "status": "success",
            "message": "Teks berhasil diekstrak",
            "total_text": len(ekstraksi_data),
            "data": ekstraksi_data
        }

    except Exception as e:
        error_str = str(e)
        error_msg = f"Exception: {error_str}\n\nTraceback:\n{traceback.format_exc()}"

        # Jika error 'could not execute a primitive', coba reinisialisasi model dan retry
        if 'primitive' in error_str.lower() or 'mkldnn' in error_str.lower():
            print('[OCR] Mendeteksi error oneDNN/MKL, mencoba reinisialisasi model...')
            try:
                ocr_model = PaddleOCR(
                    use_textline_orientation=True,
                    lang='en',
                    use_mkldnn=False,
                    enable_mkldnn=False
                )
                result = ocr_model.ocr(image_path)
                if result and result != [None] and result[0]:
                    res = result[0]
                    ekstraksi_data = []
                    for line in res:
                        if line is None:
                            continue
                        box = line[0]
                        text = line[1][0]
                        score = line[1][1]
                        formatted_box = [[int(p[0]), int(p[1])] for p in box]
                        ekstraksi_data.append({
                            "text": str(text),
                            "confidence_score": round(float(score), 4),
                            "box_coordinates": formatted_box
                        })
                    return {
                        "status": "success",
                        "message": "Teks berhasil diekstrak (setelah reinisialisasi)",
                        "total_text": len(ekstraksi_data),
                        "data": ekstraksi_data
                    }
            except Exception as retry_e:
                error_msg = f"Exception (retry): {str(retry_e)}\n\nTraceback:\n{traceback.format_exc()}"

        return {
            "status": "error",
            "message": error_msg,
            "data": []
        }

# Inisialisasi Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("[Supabase] Berhasil terhubung ke database cloud.")
    except Exception as e:
        print(f"[Supabase Error] Gagal inisialisasi: {e}")
else:
    print("[Supabase Warning] SUPABASE_URL atau SUPABASE_KEY belum diatur di .env")

# 5. FUNGSI GEMINI
def get_gemini_summary(ocr_texts):
    if not gemini_client:
        return "Maaf Kakek/Nenek, asisten AI belum diaktifkan (API Key belum diatur)."
    
    if not ocr_texts:
        return "Tidak ada teks yang bisa dianalisis."
    
    gabungan_teks = " ".join(ocr_texts)
    prompt = f"""Kamu adalah asisten ekstraksi data. Dari teks hasil OCR berikut, temukan HANYA nama obatnya. 
Jika kamu menemukan nama obat (seperti Paracetamol, Amlodipine, Promag, dll), balas dengan NAMA OBAT SAJA tanpa kalimat lain, tanpa tanda baca. 
Jika tidak ada nama obat yang dikenali, balas dengan teks "TIDAK DITEMUKAN". 
Teks OCR: {gabungan_teks}"""
    
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        extracted_name = response.text.strip().lower()
        print(f"[Gemini Extracted] {extracted_name}")
        
        if extracted_name == "tidak ditemukan" or not extracted_name:
            return "Maaf Kakek/Nenek, nama obat tidak ditemukan atau tidak terbaca dengan jelas."
        
        # Cari di Supabase
        if supabase:
            try:
                # Cari menggunakan ilike agar partial match (case-insensitive) tetap tertangkap
                result = supabase.table('obat').select('*').ilike('nama_obat', f'%{extracted_name}%').execute()
                if result.data and len(result.data) > 0:
                    return result.data[0]['deskripsi']
            except Exception as e:
                print(f"[Supabase Read Error] {e}")
                
        # Jika tidak ditemukan di Supabase, minta Gemini untuk menjelaskan obat tersebut
        print(f"[Gemini] Obat '{extracted_name}' tidak ada di Supabase, meminta penjelasan ke AI...")
        prompt_penjelasan = f"Jelaskan fungsi obat {extracted_name.title()} dalam maksimal 2 kalimat menggunakan bahasa Indonesia yang sangat sederhana dan sopan untuk orang tua (kakek/nenek). Jangan gunakan istilah medis."
        
        try:
            res_penjelasan = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_penjelasan,
            )
            penjelasan_baru = res_penjelasan.text.strip()
            
            # Simpan ke Supabase
            if supabase:
                try:
                    supabase.table('obat').insert({'nama_obat': extracted_name, 'deskripsi': penjelasan_baru}).execute()
                    print(f"[DB] Obat baru '{extracted_name}' berhasil ditambahkan ke Supabase")
                except Exception as e:
                    print(f"[DB Error] Gagal menyimpan ke Supabase: {e}")
                
            return penjelasan_baru
            
        except Exception as e:
            print(f"[Gemini Error - Penjelasan] {str(e)}")
            return f"Maaf Kakek/Nenek, obat '{extracted_name.title()}' terbaca, namun terjadi kesalahan saat mencari fungsinya."
        
    except Exception as e:
        print(f"[Gemini Error] {str(e)}")
        return "Maaf Kakek/Nenek, terjadi kesalahan saat menghubungi asisten AI."

# 6. ENDPOINT FLASK API
@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    # Gunakan UUID unik per request untuk mencegah konflik file antar request
    unique_id = str(uuid.uuid4())[:8]
    raw_path = os.path.abspath(f"temp_raw_{unique_id}.png")
    processed_path = os.path.abspath(f"temp_processed_{unique_id}.png")

    try:
        # Simpan file asli
        file.save(raw_path)

        # Preprocessing gambar sebelum OCR
        success = preprocess_image(raw_path, processed_path)

        # Gunakan gambar yang sudah diproses jika berhasil, jika tidak pakai asli
        ocr_input = processed_path if success and os.path.exists(processed_path) else raw_path

        hasil = proses_ocr_untuk_api(ocr_input)

        if hasil.get("status") == "success" and hasil.get("total_text", 0) > 0:
            ocr_texts = [item["text"] for item in hasil.get("data", [])]
            hasil["gemini_summary"] = get_gemini_summary(ocr_texts)
        else:
            hasil["gemini_summary"] = "Maaf Kakek/Nenek, tulisan pada obat tidak terlihat jelas."

    except Exception as e:
        error_msg = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        return jsonify({"status": "error", "message": error_msg, "data": []})

    finally:
        # Hapus kedua file temp setelah selesai
        for path in [raw_path, processed_path]:
            if os.path.exists(path):
                os.remove(path)
                
        # Bersihkan memori RAM
        import gc
        gc.collect()

    return jsonify(hasil)


# 6. JALANKAN SERVER
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
