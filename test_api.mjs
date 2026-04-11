import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Cari gambar PNG/JPG apapun di folder ini untuk dites
const imageExtensions = ['.png', '.jpg', '.jpeg'];
let testImagePath = null;

// Cari gambar di src/assets atau di root
const searchDirs = ['./src/assets', '.'];
for (const dir of searchDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
      testImagePath = path.join(dir, file);
      break;
    }
  }
  if (testImagePath) break;
}

if (!testImagePath || !fs.existsSync(testImagePath)) {
  console.error("❌ Tidak ada gambar ditemukan untuk tes. Silakan tambahkan gambar PNG/JPG ke folder ini.");
  process.exit(1);
}

console.log(`🖼️  Menggunakan gambar: ${testImagePath}`);
console.log("📡 Mengirim request ke Hugging Face Spaces...\n");

async function testApi() {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath));

    const response = await axios.post('https://noven241-visionary-backend-ocr.hf.space/ocr', form, {
      headers: form.getHeaders(),
      timeout: 60000,   // 60 detik timeout
    });

    const data = response.data;
    console.log("✅ Status:", data.status);
    console.log("📝 Message:", data.message);
    console.log("🔢 Total teks ditemukan:", data.total_text);

    if (data.data && data.data.length > 0) {
      console.log("\n📋 Hasil Ekstraksi:");
      data.data.forEach((item, i) => {
        console.log(`  ${i + 1}. "${item.text}" (akurasi: ${(item.confidence_score * 100).toFixed(1)}%)`);
      });
    } else {
      console.log("\n⚠️  Tidak ada teks yang berhasil diekstrak.");
      console.log("    Full response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else if (err.code === 'ECONNABORTED') {
      console.error("❌ Timeout: Server tidak merespons dalam 60 detik.");
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

testApi();
