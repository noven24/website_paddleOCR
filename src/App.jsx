import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultArea from './components/ResultArea';
import LoadingSpinner from './components/LoadingSpinner';
import HistorySection from './components/HistorySection';
import { extractTextFromImageReal as extractTextFromImage } from './api/realApi';

// Tampilan saat 0 teks ditemukan
function EmptyResult({ onRetry, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="text-5xl">🔍</div>
      <h3 className="text-xl font-bold text-surface-800 dark:text-surface-200">
        Teks Tidak Terdeteksi
      </h3>
      <p className="text-surface-500 dark:text-surface-400 max-w-sm text-sm">
        OCR tidak berhasil menemukan teks pada gambar ini. Pastikan gambar cukup terang, jelas, dan tidak buram.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full font-semibold text-sm shadow hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          🔄 Coba Lagi
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-full text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          Ganti Gambar
        </button>
      </div>
    </div>
  );
}

// Tampilan saat terjadi error API
function ErrorResult({ message, onRetry, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-5xl">⚠️</div>
      <h3 className="text-xl font-bold text-red-600">Terjadi Kesalahan</h3>
      <p className="text-surface-500 dark:text-surface-400 max-w-md text-sm font-mono bg-surface-100 dark:bg-surface-900 p-3 rounded-lg text-left whitespace-pre-wrap break-all">
        {message?.slice(0, 300)}{message?.length > 300 ? '...' : ''}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full font-semibold text-sm shadow hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          🔄 Coba Lagi
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-full text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          Ganti Gambar
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [history, setHistory] = useState([]);

  // Simpan referensi file TERAKHIR yang diekstrak agar bisa "Coba Lagi"
  const [currentFile, setCurrentFile] = useState(null);

  // ============================================================
  // FUNGSI INTI: Ekstrak teks dari file
  // ============================================================
  const runExtraction = useCallback(async (file, previewUrl) => {
    if (!file) {
      console.error('[App] runExtraction dipanggil tanpa file!');
      return;
    }

    console.log(`[App] Mulai ekstraksi: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setIsLoading(true);
    setImageUrl(previewUrl);
    setResultData(null);

    try {
      const data = await extractTextFromImage(file);
      console.log('[App] Hasil API:', data);
      setResultData(data);
    } catch (error) {
      console.error('[App] Ekstraksi gagal:', error);
      setResultData({
        status: 'error',
        message: error.message || 'Koneksi ke server OCR gagal.',
        total_text: 0,
        data: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // Handler dari UploadArea: simpan file lalu ekstrak
  // ============================================================
  const handleExtract = useCallback((file, previewUrl) => {
    setCurrentFile(file); // Simpan file agar bisa "Coba Lagi"
    runExtraction(file, previewUrl);
  }, [runExtraction]);

  // ============================================================
  // "Coba Lagi": ekstrak ulang dengan file YANG SAMA
  // ============================================================
  const handleRetry = useCallback(() => {
    if (!currentFile || !imageUrl) {
      console.error('[App] handleRetry: tidak ada file tersimpan, reset ke upload.');
      handleReset();
      return;
    }
    console.log('[App] Mencoba lagi dengan file yang sama...');
    runExtraction(currentFile, imageUrl);
  }, [currentFile, imageUrl, runExtraction]);

  // ============================================================
  // Reset: simpan ke history lalu kembali ke tampilan upload
  // ============================================================
  const handleReset = useCallback(() => {
    // Simpan ke history hanya jika ada hasil yang bermakna
    if (resultData && imageUrl && resultData.total_text > 0) {
      setHistory(prev => [
        ...prev,
        {
          id: prev.length + 1,
          imageUrl,
          resultData,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setResultData(null);
    setImageUrl(null);
    setCurrentFile(null);
    // Increment key untuk force remount UploadArea (bersihkan state internal)
    setUploadKey(prev => prev + 1);
  }, [resultData, imageUrl]);

  // ============================================================
  // Tentukan konten yang ditampilkan di area hasil
  // ============================================================
  const isError = resultData?.status === 'error';
  const isEmpty = resultData?.status === 'success' && resultData?.total_text === 0;
  const hasResults = resultData?.status === 'success' && resultData?.total_text > 0;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 font-sans text-surface-900 dark:text-surface-50 selection:bg-primary/30">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Bantu Baca <span className="text-primary">Obat</span>
          </h2>
          <p className="text-xl text-surface-600 dark:text-surface-400 mb-6">
            Aplikasi khusus untuk kakek dan nenek. Foto bungkus obat, dan kami akan membantu membacakan apa nama obatnya dan fungsinya dengan mudah.
          </p>
          
          {/* Kotak Peringatan Medis di Halaman Depan */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-2xl text-left shadow-sm">
            <span className="text-3xl hidden sm:block">⚠️</span>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              <strong>Perhatian:</strong> Aplikasi ini hanyalah "Alat Bantu" pembaca label, BUKAN pengganti resep atau nasihat dokter. Jika Kakek/Nenek merasa ragu, tolong jangan diminum dulu.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-6xl mx-auto">

          {/* Upload Area: tampil hanya saat tidak loading dan belum ada hasil */}
          {!resultData && !isLoading && (
            <UploadArea
              key={uploadKey}
              onExtract={handleExtract}
              isLoading={isLoading}
            />
          )}

          <AnimatePresence mode="wait">

            {/* Loading Indicator Besar Khusus Lansia */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center my-16 gap-8 text-center"
              >
                <div className="w-24 h-24 border-8 border-surface-200 dark:border-surface-800 border-t-primary rounded-full animate-spin"></div>
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-surface-800 dark:text-surface-100 mb-4 px-4 leading-tight">
                    Sedang membaca obat...
                  </h2>
                  <p className="text-2xl text-surface-600 dark:text-surface-400">
                    Tunggu sebentar ya, jangan ditutup layarnya.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Hasil dengan teks ditemukan */}
            {hasResults && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      Fungsi Obat Anda
                    </h3>
                    <p className="text-surface-500 dark:text-surface-400 text-lg mt-1">
                      Berikut adalah penjelasan sederhana dari obat ini:
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors shadow-sm"
                  >
                    Unggah Gambar Lain
                  </button>
                </div>
                <ResultArea originalImage={imageUrl} resultData={resultData} />
              </motion.div>
            )}

            {/* Hasil kosong (0 teks) */}
            {isEmpty && !isLoading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-lg overflow-hidden">
                  {/* Gambar tetap ditampilkan */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-6 flex items-center justify-center bg-surface-50 dark:bg-surface-950 min-h-[300px]">
                      <img
                        src={imageUrl}
                        alt="Uploaded"
                        className="max-h-72 max-w-full object-contain rounded-xl shadow"
                      />
                    </div>
                    <EmptyResult onRetry={handleRetry} onReset={handleReset} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error dari API */}
            {isError && !isLoading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-surface-900 border border-red-200 dark:border-red-900/50 rounded-3xl shadow-lg overflow-hidden p-6">
                  <ErrorResult
                    message={resultData.message}
                    onRetry={handleRetry}
                    onReset={handleReset}
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* History Section */}
        <HistorySection history={history} />
      </main>
    </div>
  );
}

export default App;
