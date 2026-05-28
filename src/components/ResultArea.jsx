import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import ResultsTabs from './ResultsTabs';
import { generateSpeechElevenLabs } from '../api/ttsApi';

export default function ResultArea({ originalImage, resultData }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const audioRef = useRef(null);
  const shouldStopRef = useRef(false);

  // Fallback: Suara bawaan browser jika Google Cloud gagal
  const speakTextNativeFallback = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.name.includes('Google Bahasa Indonesia')) 
                   || voices.find(v => v.name.includes('Andika') || v.name.includes('Gadis'))
                   || voices.find(v => v.lang === 'id-ID' && !v.localService) 
                   || voices.find(v => v.lang.includes('id'));
                   
    if (bestVoice) utterance.voice = bestVoice;
    utterance.rate = 0.85; 
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async () => {
    if (!resultData?.gemini_summary) return;
    
    stopSpeaking(); // Hentikan jika sedang bicara
    shouldStopRef.current = false;
    
    setIsFetchingAudio(true);
    try {
      // 1. Memanggil ElevenLabs TTS
      const audioUrls = await generateSpeechElevenLabs(resultData.gemini_summary);
      setIsFetchingAudio(false);
      setIsSpeaking(true);
      
      // Memutar potongan suara secara berurutan
      for (let url of audioUrls) {
        if (shouldStopRef.current) break; // Berhenti jika user menekan tombol stop
        
        await new Promise((resolve, reject) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          
          audio.onended = resolve;
          audio.onerror = reject;
          
          audio.play().catch(reject);
        });
      }
      
      setIsSpeaking(false);
    } catch (error) {
      console.warn("ElevenLabs TTS gagal, menggunakan suara cadangan.", error);
      setIsFetchingAudio(false);
      setIsSpeaking(false);
      // 2. Gunakan suara robot (Browser) jika ElevenLabs gagal
      speakTextNativeFallback(resultData.gemini_summary);
    }
  };

  const stopSpeaking = () => {
    shouldStopRef.current = true;
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsFetchingAudio(false);
  };

  // Langsung bacakan otomatis saat teks muncul!
  useEffect(() => {
    if (resultData?.gemini_summary) {
      setTimeout(speakText, 600); // Beri jeda sedikit agar transisi animasi selesai
    }
    return () => stopSpeaking(); // Matikan suara jika komponen hilang
  }, [resultData?.gemini_summary]);

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
            <h3 className="font-bold text-xl text-surface-900 dark:text-surface-100">Foto Obat Anda</h3>
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
        <div className="flex flex-col h-full gap-4">
          {/* Gemini Summary Box - Sangat Menonjol */}
          <div className="bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 rounded-3xl p-6 shadow-md flex-shrink-0 h-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                <span className="text-3xl">💊</span> Keterangan Obat:
              </h3>
              
              {/* Tombol Kontrol Suara */}
              <div className="flex gap-2">
                {isFetchingAudio ? (
                  <button disabled className="bg-surface-500 text-white p-2 px-4 rounded-full font-bold shadow flex items-center gap-2 opacity-70 cursor-not-allowed">
                    <span className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></span> <span>Memuat Suara...</span>
                  </button>
                ) : isSpeaking ? (
                  <button onClick={stopSpeaking} className="bg-red-500 hover:bg-red-600 text-white p-2 px-4 rounded-full font-bold shadow animate-pulse flex items-center gap-2">
                    <span>🛑 Berhenti</span>
                  </button>
                ) : (
                  <button onClick={speakText} className="bg-green-500 hover:bg-green-600 text-white p-2 px-4 rounded-full font-bold shadow flex items-center gap-2">
                    <span className="text-xl">🔊</span> <span>Bacakan Ulang</span>
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-2xl leading-relaxed text-surface-900 dark:text-surface-50 font-medium">
              {resultData.gemini_summary || "Sedang menganalisis teks obat..."}
            </p>
          </div>
          
          <details open className="group bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm flex-1 flex flex-col mb-4">
            <summary className="p-4 font-semibold text-lg cursor-pointer text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors list-none flex justify-between items-center">
              <span>Tampilkan Detail Teks Asli (Pilihan)</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <div className="p-4 pt-0 h-[250px] lg:flex-1 flex flex-col">
               <ResultsTabs data={resultData} />
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  );
}
