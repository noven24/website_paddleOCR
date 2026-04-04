import { useState } from 'react';
import { Table, Code2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsTabs({ data }) {
  const [activeTab, setActiveTab] = useState('table');
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-lg">
      <div className="flex items-center p-2 border-b border-surface-200 dark:border-surface-800">
        <div className="flex p-1 bg-surface-200/50 dark:bg-surface-950/50 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('table')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors z-10 ${
              activeTab === 'table' ? 'text-primary' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            }`}
          >
            {activeTab === 'table' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Table className="w-4 h-4" />
            Tabel Teks
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors z-10 ${
              activeTab === 'json' ? 'text-primary' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            }`}
          >
            {activeTab === 'json' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Code2 className="w-4 h-4" />
            Raw JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'table' ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute inset-0 overflow-auto p-4"
            >
              <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-100 dark:bg-surface-950 uppercase text-xs font-semibold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700">
                    <tr>
                      <th className="px-6 py-4 w-16 text-center">No</th>
                      <th className="px-6 py-4">Teks yang Diekstrak</th>
                      <th className="px-6 py-4 w-32 text-right">Akurasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700 bg-white dark:bg-surface-900">
                    {data?.data?.map((item, index) => (
                      <tr key={index} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-6 py-4 text-center font-mono text-surface-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                          {item.text}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            item.confidence_score > 0.9 
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' 
                              : item.confidence_score > 0.7
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                          }`}>
                            {(item.confidence_score * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="json"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute inset-0 flex flex-col p-4 bg-[#1e1e1e]"
            >
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-mono text-surface-400">response.json</span>
                <button 
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex-1 overflow-auto rounded-xl border border-surface-700/50 bg-[#141414] p-4 text-sm font-mono text-[#d4d4d4] scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent">
                <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
