import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { moduleRoutes } from '../config/routes';
import { Home, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found');
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg"
      >
        <h1 className="text-8xl font-bold bg-gradient-to-b from-text to-text-muted bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-xl text-text mb-2">Page not found</p>
        <p className="text-sm text-text-muted mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
        >
          <Home size={16} />
          Back to Home
        </Link>

        <div className="mt-12 text-left">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Available modules
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {moduleRoutes.slice(0, 6).map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-border text-sm text-text-muted hover:text-text hover:border-primary/40 transition-colors"
              >
                <span>{route.title}</span>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
