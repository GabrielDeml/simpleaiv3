import { type ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackendBadge } from '../shared/BackendBadge';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

interface ModuleLayoutProps {
  title: string;
  description: string;
  learnMore?: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
}

export function ModuleLayout({
  title,
  description,
  learnMore,
  children,
  controls,
}: ModuleLayoutProps) {
  useDocumentTitle(title);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text truncate">{title}</h1>
            <p className="text-sm text-text-muted mt-0.5">{description}</p>
          </div>
          {learnMore && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-1 shrink-0 text-xs text-primary hover:text-primary-light transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
              aria-expanded={showInfo}
            >
              <Info size={14} />
              <span className="hidden sm:inline">{showInfo ? 'Hide' : 'How it works'}</span>
              {showInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
        <BackendBadge />
      </header>

      <AnimatePresence>
        {showInfo && learnMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 py-5 bg-surface-light border-b border-border">
              <div className="max-w-3xl text-sm text-text-muted leading-relaxed space-y-3">
                {typeof learnMore === 'string' ? <p>{learnMore}</p> : learnMore}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 p-6 overflow-auto">{children}</div>
        {controls && (
          <aside className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border p-4 overflow-y-auto bg-surface-light">
            {controls}
          </aside>
        )}
      </div>
    </div>
  );
}
