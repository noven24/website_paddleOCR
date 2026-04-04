import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent tracking-tight">
              Visionary OCR
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">API: Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
