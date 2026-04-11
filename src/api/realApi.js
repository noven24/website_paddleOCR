import axios from 'axios';

// URL public dari Hugging Face Space Anda
const API_URL = 'https://noven241-visionary-backend-ocr.hf.space/ocr';

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kirim gambar ke OCR API dengan mekanisme RETRY otomatis.
 * Ini menangani kasus Hugging Face Space "tidur" (cold start)
 * yang sering menyebabkan hasil kosong pada request pertama.
 */
export const extractTextFromImageReal = async (file) => {
  const MAX_RETRIES = 3;
  const DELAY_MS = 3000; // Tunggu 3 detik sebelum retry

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[OCR] Percobaan ${attempt}/${MAX_RETRIES}...`);

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // 90 detik timeout per request
      });

      const data = response.data;

      // Jika server mengembalikan error, langsung lempar
      if (data.status === 'error') {
        console.error('[OCR] Server error:', data.message);
        throw new Error(data.message || 'Server OCR mengembalikan error.');
      }

      // Jika hasil kosong (0 teks), kemungkinan cold start - retry
      if (data.status === 'success' && data.total_text === 0 && attempt < MAX_RETRIES) {
        console.warn(`[OCR] Percobaan ${attempt}: 0 teks ditemukan (kemungkinan cold start). Menunggu dan mencoba lagi...`);
        await delay(DELAY_MS);
        continue; // Coba lagi
      }

      // Berhasil - kembalikan data
      console.log(`[OCR] Berhasil pada percobaan ${attempt}: ${data.total_text} teks ditemukan.`);
      return data;

    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[OCR] Percobaan ${attempt} gagal: ${error.message}. Menunggu dan mencoba lagi...`);
        await delay(DELAY_MS);
        continue;
      }
      // Semua percobaan gagal
      console.error('[OCR] Semua percobaan gagal:', error.message);
      throw error;
    }
  }
};
