@echo off
echo ========================================================
echo Membangun environment khusus Python 3.10 (ocr_env)...
echo ========================================================

REM Cek apakah environment ocr_env sudah ada
if not exist "C:\Users\user\miniconda4\envs\ocr_env" (
    call conda create -y -n ocr_env python=3.10
)

echo.
echo Menginstall library (hanya butuh waktu sebentar)...
call C:\Users\user\miniconda4\envs\ocr_env\python.exe -m pip install -r requirements.txt

echo.
echo ========================================================
echo Menjalankan server aplikasi...
echo ========================================================
call C:\Users\user\miniconda4\envs\ocr_env\python.exe app.py
pause
