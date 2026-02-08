import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { moduleRoutes, mathRoutes } from '../config/routes';
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
  Zap,
  GitBranch,
  ArrowDownRight,
  Grid3x3,
  Sparkles,
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
  Zap,
  GitBranch,
  ArrowDownRight,
  Grid3x3,
  Sparkles,
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
        <div
          className="absolute -top-16 -left-16 w-96 h-96 bg-primary/15 rounded-full blur-[100px] pointer-events-none animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute top-8 -right-8 w-72 h-72 bg-accent-purple/15 rounded-full blur-[100px] pointer-events-none animate-pulse"
          style={{ animationDuration: '6s' }}
        />

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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-medium border border-accent-green/20">
              <Shield size={14} />
              No data leaves your device
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
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
                className="group flex flex-col p-5 rounded-xl border border-white/[0.06] bg-surface-light/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_15px_rgba(37,99,235,0.08)] transition-all duration-300 h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.15)] transition-colors">
                    <Icon size={22} />
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                  >
                    {diff.label}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-text mb-1.5 group-hover:text-primary transition-colors">
                  {route.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed flex-1">
                  {route.description}
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded border border-white/[0.04]">
                    {route.tech}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Math Deep Dives */}
      <div className="mt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl font-bold text-text mb-2 tracking-tight">Math Deep Dives</h2>
          <p className="text-sm text-text-muted mb-6">
            Interactive walkthroughs of the math behind AI — play with every equation.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {mathRoutes.map((route) => {
            const Icon = iconMap[route.icon] || Brain;
            return (
              <motion.div key={route.path} variants={cardVariant}>
                <Link
                  to={route.path}
                  className="group flex flex-col p-5 rounded-xl border border-white/[0.06] bg-surface-light/80 backdrop-blur-sm hover:border-accent-purple/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_15px_rgba(139,92,246,0.08)] transition-all duration-300 h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-accent-purple/10 text-accent-purple group-hover:bg-accent-purple/20 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-colors">
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple">
                      Math
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-text mb-1.5 group-hover:text-accent-purple transition-colors">
                    {route.title}
                  </h3>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

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
