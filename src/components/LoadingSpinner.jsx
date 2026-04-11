import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "AI sedang memproses dokumen Anda...",
  "Menganalisis teks dalam gambar...",
  "Hampir selesai, mohon tunggu...",
  "Server OCR sedang bekerja keras...",
];

export default function LoadingSpinner() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Ganti pesan setiap 4 detik agar pengguna tahu proses masih berjalan
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center p-12 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
      </div>
      <h3 className="mt-6 text-lg font-medium text-surface-900 dark:text-surface-50">Memproses Data</h3>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.4 }}
          className="mt-2 text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs"
        >
          {messages[msgIndex]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-4 text-xs text-surface-400 dark:text-surface-500 text-center">
        Proses pertama mungkin lebih lama (10-30 detik) karena server perlu pemanasan.
      </p>
    </motion.div>
  );
}
