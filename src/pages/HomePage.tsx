import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { moduleRoutes } from '../config/routes';
import { DIFFICULTY } from '../config/constants';
import {
  TrendingUp,
  Layers,
  Mountain,
  Brain,
  Image,
  Repeat,
  Eye,
  MessageSquare,
  Shield,
  Cpu,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TrendingUp,
  Layers,
  Mountain,
  Brain,
  Image,
  Repeat,
  Eye,
  MessageSquare,
};

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HomePage() {
  useDocumentTitle('');
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="relative mb-16">
        <div className="absolute -top-8 -left-8 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-16 right-0 w-48 h-48 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-text mb-4 tracking-tight">
            Simple
            <span className="bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
            An interactive machine learning playground. Explore core ML concepts through hands-on
            visualizations -- from linear regression to large language models, all running entirely
            in your browser.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-medium">
              <Shield size={14} />
              No data leaves your device
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Cpu size={14} />
              GPU-accelerated in browser
            </div>
          </div>
        </motion.div>
      </div>

      {/* Module Cards */}
      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {moduleRoutes.map((route) => {
          const Icon = iconMap[route.icon] || Brain;
          const diff = DIFFICULTY[route.difficulty];
          return (
            <motion.div key={route.path} variants={cardVariant}>
              <Link
                to={route.path}
                className="group flex flex-col p-5 rounded-xl border border-border bg-surface-light hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} />
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                  >
                    {diff.label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-text mb-1.5 group-hover:text-primary transition-colors">
                  {route.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed flex-1">
                  {route.description}
                </p>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded">
                    {route.tech}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-16 pt-8 border-t border-border text-center"
      >
        <p className="text-xs text-text-muted">
          Built with TensorFlow.js, WebLLM, Three.js, and React. All models execute client-side
          using WebGL / WebGPU.
        </p>
      </motion.footer>
    </div>
  );
}
