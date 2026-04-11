import os
import uuid
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# Set thread environment SEBELUM import paddle apapun
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
# Matikan Intel oneDNN untuk mencegah error 'could not execute a primitive'
# Error ini muncul karena CPU server HF tidak mendukung semua instruksi AVX/oneDNN
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['FLAGS_mkldnn_cache_capacity'] = '0'
os.environ['DNNL_DEFAULT_FPMATH_MODE'] = 'F32'

# 1. IMPORT DAN INISIALISASI PADDLEOCR v2.7.3
from paddleocr import PaddleOCR
from PIL import Image as PILImage

ocr_model = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    show_log=False
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

        # Resize jika dimensi terlalu besar (PaddleOCR struggle di atas 2000px)
        MAX_DIM = 2000
        width, height = img.size
        if max(width, height) > MAX_DIM:
            ratio = MAX_DIM / max(width, height)
            new_w = int(width * ratio)
            new_h = int(height * ratio)
            img = img.resize((new_w, new_h), PILImage.LANCZOS)

        # Simpan gambar yang sudah diproses
        img.save(output_path, 'PNG', optimize=False)
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
                    use_angle_cls=True,
                    lang='en',
                    show_log=False
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

# 5. ENDPOINT FLASK API
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

    except Exception as e:
        error_msg = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        return jsonify({"status": "error", "message": error_msg, "data": []})

    finally:
        # Hapus kedua file temp setelah selesai
        for path in [raw_path, processed_path]:
            if os.path.exists(path):
                os.remove(path)

    return jsonify(hasil)


# 6. JALANKAN SERVER
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
