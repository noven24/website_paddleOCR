import { motion } from 'framer-motion';
import ResultsTabs from './ResultsTabs';

export default function ResultArea({ originalImage, resultData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[600px]">
        {/* Kolom Kiri: Gambar Asli */}
        <div className="flex flex-col bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-100/50 dark:bg-surface-950/50">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Gambar Asli</h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-surface-200 dark:bg-surface-800 rounded-full text-surface-600 dark:text-surface-400">
              Input
            </span>
          </div>
          <div className="flex-1 relative bg-surface-100 dark:bg-surface-950 p-4 flex items-center justify-center overflow-hidden min-h-[300px] lg:min-h-0">
            <img 
              src={originalImage} 
              alt="Original Document" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>

        {/* Kolom Kanan: Hasil Ekstraksi */}
        <div className="flex flex-col h-[500px] lg:h-full">
          <ResultsTabs data={resultData} />
        </div>
      </div>
    </motion.div>
  );
}
