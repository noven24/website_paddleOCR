import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultArea from './components/ResultArea';
import LoadingSpinner from './components/LoadingSpinner';
// Ganti mockApi dengan realApi
import { extractTextFromImageReal as extractTextFromImage } from './api/realApi';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleExtract = async (file, previewUrl) => {
    if (!file) return;
    
    setIsLoading(true);
    setImageUrl(previewUrl);
    setResultData(null);
    
    try {
      const data = await extractTextFromImage(file);
      setResultData(data);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Gagal melakukan ekstraksi teks.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResultData(null);
    setImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 font-sans text-surface-900 dark:text-surface-50 selection:bg-primary/30">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Ubah Gambar Menjadi <span className="text-primary">Data</span>
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Platform Model as a Service (MaaS) berbasis Optical Character Recognition tercanggih. Proses ekstrak teks secara instan dan akurat.
          </p>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-6xl mx-auto">
          {!resultData && !isLoading && (
            <UploadArea onExtract={handleExtract} isLoading={isLoading} />
          )}

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-center my-12"
              >
                <LoadingSpinner />
              </motion.div>
            )}

            {resultData && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      Hasil Ekstraksi
                    </h3>
                    <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
                      Berhasil mengekstrak {resultData?.total_text || 0} baris teks.
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
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
