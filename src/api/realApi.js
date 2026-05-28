import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// URL public dari Hugging Face Space Anda
const API_URL = 'https://noven241-visionary-backend-ocr.hf.space/ocr';

// Inisialisasi Gemini API dari env frontend (Vite menggunakan import.meta.env)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kirim gambar ke OCR Hugging Face, lalu rangkum dengan Google Gemini
 */
export const extractTextFromImageReal = async (file) => {
  const MAX_RETRIES = 3;
  const DELAY_MS = 3000; // Tunggu 3 detik sebelum retry

  let ocrData = null;

  // 1. TAHAP OCR (Hugging Face)
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

      if (data.status === 'error') {
        throw new Error(data.message || 'Server OCR mengembalikan error.');
      }

      // Jika hasil kosong (0 teks), kemungkinan cold start - retry
      if (data.status === 'success' && data.total_text === 0 && attempt < MAX_RETRIES) {
        console.warn(`[OCR] Percobaan ${attempt}: 0 teks ditemukan. Menunggu...`);
        await delay(DELAY_MS);
        continue;
      }

      // Berhasil
      console.log(`[OCR] Berhasil pada percobaan ${attempt}: ${data.total_text} teks ditemukan.`);
      ocrData = data;
      break;

    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[OCR] Percobaan ${attempt} gagal: ${error.message}. Menunggu...`);
        await delay(DELAY_MS);
        continue;
      }
      console.error('[OCR] Semua percobaan gagal:', error.message);
      throw error;
    }
  }

  if (!ocrData) {
    throw new Error('Gagal memproses gambar melalui server OCR.');
  }

  // 2. TAHAP GEMINI AI
  if (ocrData.total_text === 0) {
    ocrData.gemini_summary = "Maaf Kakek/Nenek, tulisan pada obat tidak terlihat jelas.";
    return ocrData;
  }

  try {
    console.log('[Gemini] Menganalisis teks obat...');
    const ocrTexts = ocrData.data.map(item => item.text);
    const gabunganTeks = ocrTexts.join(" ");
    
    const prompt = `Kamu adalah asisten apoteker untuk lansia. Dari teks hasil OCR berikut, cobalah temukan nama produk kesehatan (obat atau suplemen).

INSTRUKSI WAJIB (SANGAT PENTING):
1. DILARANG MENEBAK! Gunakan MURNI dari data medis internalmu yang sudah terverifikasi (pengetahuan BPOM/Medis).
2. Jika produk ini tidak ada di database medismu, atau kamu ragu 1%, barulah jawab dengan: "Maaf Kakek atau Nenek, data obat ini tidak saya temukan di sistem saya." (Dilarang mengarang fungsi obat yang tidak diketahui!).
3. Jika kamu tahu pasti obat/suplemen ini, jelaskan fungsinya secara singkat.
4. FOKUS PADA VARIAN SPESIFIK: Jika produk punya banyak varian, kamu WAJIB mencocokkannya dengan kata kunci kegunaan di Teks OCR (misal: "Sakit Kepala" atau "Pencernaan"). HANYA jelaskan fungsi untuk varian yang ada di gambar!
5. Jelaskan maksimal 2 kalimat menggunakan bahasa Indonesia yang sangat sederhana dan sopan (sebut "Kakek atau Nenek").
6. JANGAN gunakan istilah medis yang sulit.
7. JANGAN gunakan simbol, garis miring, bintang, atau tanda baca aneh. Gunakan alfabet biasa saja.

Teks OCR dari foto: ${gabunganTeks}`;

    // Gunakan model gemini-2.5-flash dengan menonaktifkan filter keamanan yang terlalu ketat untuk obat-obatan
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      }
    ];

    // AI dipanggil tanpa Live Search agar menghemat 90% token
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      safetySettings
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Bersihkan teks dari sisa-sisa simbol atau markdown sebelum ditampilkan
    let cleanText = response.text();
    cleanText = cleanText.replace(/\*\*/g, ''); // Hapus format bold markdown
    cleanText = cleanText.replace(/\*/g, '');   // Hapus bintang
    cleanText = cleanText.replace(/\//g, ' atau '); // Ganti slash dengan kata "atau"
    cleanText = cleanText.replace(/_ /g, '');    // Hapus underscore
    
    ocrData.gemini_summary = cleanText;
    console.log('[Gemini] Berhasil mendapatkan rangkuman.');
  } catch (error) {
    console.error("[Gemini Error]", error);
    
    // Penanganan khusus jika kuota gratis Google Gemini habis
    if (error.message.includes("429") || error.message.toLowerCase().includes("quota")) {
      ocrData.gemini_summary = "Maaf Kakek/Nenek, sistem pembaca sedang beristirahat sebentar karena terlalu banyak digunakan. Mohon tunggu sekitar 1 menit lalu tekan tombol 'Bacakan Ulang'.";
    } else {
      ocrData.gemini_summary = `Maaf Kakek/Nenek, terjadi kesalahan. (Pesan sistem: ${error.message})`;
    }
  }

  return ocrData;
};
