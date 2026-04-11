# 1. Gunakan base image Python yang stabil
FROM python:3.10-slim

# 2. Update sistem operasi dan install SEMUA library Linux yang dibutuhkan PaddleOCR
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    libgomp1 \
    libgcc-s1 \
    libstdc++6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable untuk mencegah error threading OpenBLAS
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
# PENTING: Matikan Intel oneDNN/MKLDNN untuk mencegah error 'could not execute a primitive'
# Error ini terjadi ketika CPU server tidak mendukung instruksi AVX/oneDNN yang dibutuhkan PaddleOCR
ENV FLAGS_use_mkldnn=0
ENV FLAGS_mkldnn_cache_capacity=0
ENV DNNL_DEFAULT_FPMATH_MODE=F32

# 4. Pindah ke direktori bekerja
WORKDIR /app

# 5. Install numpy versi kompatibel DULU sebelum paddlepaddle (urutan penting!)
RUN pip install --no-cache-dir "numpy>=1.23.0,<2.0"

# 6. Install paddlepaddle CPU setelah numpy sudah siap
RUN pip install --no-cache-dir paddlepaddle==2.6.2

# 7. Copy dan install sisa requirements
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 8. Copy sisa kode (termasuk app.py)
COPY . .

# 9. Atur Permissions untuk Hugging Face (berjalan sebagai user 1000)
ENV HOME=/app
RUN chmod -R 777 /app

# 10. Jalankan Aplikasi
CMD ["python", "app.py"]
