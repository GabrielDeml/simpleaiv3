import { NavLink, useLocation } from 'react-router';
import { moduleRoutes } from '../../config/routes';
import {
  Home,
  TrendingUp,
  Layers,
  Mountain,
  Brain,
  Image,
  Repeat,
  Eye,
  MessageSquare,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  TrendingUp,
  Layers,
  Mountain,
  Brain,
  Image,
  Repeat,
  Eye,
  MessageSquare,
};

export function Navigation() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile nav on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMobileOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <NavLink to="/" className="text-lg font-bold text-text tracking-tight">
            SimpleAI
          </NavLink>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1.5 rounded-md hover:bg-surface-lighter text-text-muted transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md hover:bg-surface-lighter text-text-muted transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-surface-lighter'
            }`
          }
        >
          <Home size={18} />
          {!collapsed && <span>Home</span>}
        </NavLink>

        <div className="mt-4 mb-1 px-4">
          {!collapsed && (
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              Modules
            </span>
          )}
        </div>

        {moduleRoutes.map((route) => {
          const Icon = iconMap[route.icon] || Brain;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                }`
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{route.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-[11px] text-text-muted leading-relaxed">
            All ML runs in your browser. No data leaves your device.
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-surface-light border border-border text-text-muted hover:text-text transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-surface-light border-r border-border"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {navContent}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <nav
        className={`hidden md:flex flex-col border-r border-border bg-surface-light transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {navContent}
      </nav>
    </>
  );
}
