# 1. Gunakan base image Python yang stabil
FROM python:3.10-slim

# 2. Update sistem operasi dan install library Linux yang dibutuhkan PaddleOCR
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 3. Pindah ke direktori bekerja dan atur User
WORKDIR /app

# 4. Copy data requirement dan install Library Python
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy sisa kode (termasuk app.py)
COPY . .

# 6. Atur Permissions untuk Hugging Face (Berjalan sebagai user 1000)
# HF Spaces butuh folder yang bisa ditulis untuk mendownload bobot model OCR 
ENV HOME=/app
RUN chmod -R 777 /app

# 7. Jalankan Aplikasi
CMD ["python", "app.py"]
