from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback

# 1. IMPORT DAN INISIALISASI PADDLEOCR (versi stabil 2.7.3)
from paddleocr import PaddleOCR

# Gunakan API lama yang kompatibel dengan paddleocr==2.7.3
# use_angle_cls=True untuk deteksi teks yang miring/rotasi
ocr_model = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

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

# 3. FUNGSI EKSTRAKSI PADDLEOCR
def proses_ocr_untuk_api(image_path):
    try:
        # API standar PaddleOCR v2.7.x - menggunakan metode .ocr()
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
            box = line[0]    # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            text = line[1][0]   # string teks
            score = line[1][1]  # float akurasi

            # Konversi koordinat ke integer
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
        error_msg = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        return {
            "status": "error",
            "message": error_msg,
            "data": []
        }

# 4. ENDPOINT FLASK API
@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    temp_path = os.path.abspath("temp_upload.png")
    file.save(temp_path)

    try:
        hasil = proses_ocr_untuk_api(temp_path)
    except Exception as e:
        error_msg = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        return jsonify({"status": "error", "message": error_msg, "data": []})
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return jsonify(hasil)


# 5. JALANKAN SERVER (PORT 7860 WAJIB untuk Hugging Face Spaces)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
