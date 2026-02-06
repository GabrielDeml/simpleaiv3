export const COLORS = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  surface: '#0f172a',
  surfaceLight: '#1e293b',
  surfaceLighter: '#334155',
  border: '#475569',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  // Dataset colors
  classColors: [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ],
} as const;

export const ANIMATION = {
  fps: 60,
  frameTime: 1000 / 60,
  transitionDuration: 0.3,
  springStiffness: 300,
  springDamping: 30,
} as const;

export const CANVAS = {
  defaultWidth: 600,
  defaultHeight: 400,
  pointRadius: 6,
  lineWidth: 2,
  gridOpacity: 0.1,
} as const;

export const DIFFICULTY = {
  beginner: { label: 'Beginner', color: '#10b981' },
  intermediate: { label: 'Intermediate', color: '#f59e0b' },
  advanced: { label: 'Advanced', color: '#ef4444' },
} as const;
