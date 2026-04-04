import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = "AI sedang memproses dokumen Anda..." }) {
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
      <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">{message}</p>
    </motion.div>
  );
}
