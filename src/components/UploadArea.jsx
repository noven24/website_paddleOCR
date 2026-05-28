import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadArea({ onExtract, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.match('image/(jpeg|png|jpg)')) {
      alert('Hanya format PNG dan JPG yang didukung.');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative rounded-3xl border-2 border-dashed p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group ${
              dragActive 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : 'border-surface-300 dark:border-surface-700 hover:border-primary/50 hover:bg-surface-50 dark:hover:bg-surface-800'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleChange}
            />
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-semibold mb-3">Pilih atau Foto Obat Anda</h3>
            <p className="text-surface-500 dark:text-surface-400 text-lg max-w-md mb-8">
              Ketuk di sini untuk mengambil foto bungkus obat menggunakan kamera HP Anda, atau pilih foto dari galeri.
            </p>
            <button className="px-8 py-4 bg-surface-900 dark:bg-surface-50 text-surface-50 dark:text-surface-900 rounded-full font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-md hover:shadow-lg">
              Ketuk Untuk Mulai
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden bg-surface-50 dark:bg-surface-900/50 shadow-xl"
          >
            <div className="relative aspect-video w-full bg-surface-100 dark:bg-surface-950 flex items-center justify-center overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain"
              />
              <button 
                onClick={clearFile}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                <div className="p-2 rounded-lg bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex-shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-surface-500">
                    {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => onExtract(selectedFile, previewUrl)}
                disabled={isLoading}
                className="w-full px-8 py-5 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full font-bold text-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Bantu Bacakan Fungsi Obat Ini
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
