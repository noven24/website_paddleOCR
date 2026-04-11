import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function HistoryItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);

  const highCount = item.resultData?.data?.filter(d => d.confidence_score > 0.9).length || 0;
  const timestamp = new Date(item.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header Item */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        onClick={() => setExpanded(prev => !prev)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-950 flex-shrink-0 border border-surface-200 dark:border-surface-700">
          <img
            src={item.imageUrl}
            alt="thumbnail"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              #{item.id}
            </span>
            <span className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
              <Clock className="w-3 h-3" />
              {timestamp}
            </span>
          </div>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
            {item.resultData?.total_text || 0} baris teks diekstrak
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {highCount} teks dengan akurasi &gt;90%
          </p>
        </div>

        {/* Expand Toggle */}
        <div className="text-surface-400 flex-shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-surface-200 dark:border-surface-800">
              {/* Image Preview */}
              <div className="p-4 bg-surface-50 dark:bg-surface-950/50">
                <img
                  src={item.imageUrl}
                  alt="Document"
                  className="max-h-48 mx-auto rounded-xl object-contain shadow"
                />
              </div>

              {/* Text Results Table */}
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-100 dark:bg-surface-950 sticky top-0 text-xs font-semibold text-surface-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3">Teks</th>
                      <th className="px-4 py-3 text-right w-24">Akurasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {item.resultData?.data?.map((d, i) => (
                      <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono text-xs text-surface-400">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-surface-800 dark:text-surface-200">{d.text}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            d.confidence_score > 0.9
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                              : d.confidence_score > 0.7
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                          }`}>
                            {(d.confidence_score * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistorySection({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto mt-16 mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800">
          <FileText className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
            Riwayat Ekstraksi
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {history.length} sesi ekstraksi sebelumnya
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {[...history].reverse().map((item, index) => (
          <HistoryItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </motion.section>
  );
}
