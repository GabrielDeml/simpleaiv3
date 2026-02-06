import { useMLBackendStore } from '../../stores/useMLBackendStore';
import { Cpu, Loader2 } from 'lucide-react';

export function BackendBadge() {
  const backend = useMLBackendStore((s) => s.backend);
  const isInitializing = useMLBackendStore((s) => s.isInitializing);

  if (isInitializing) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-surface-lighter text-text-muted">
        <Loader2 size={12} className="animate-spin" />
        Initializing ML...
      </span>
    );
  }

  const colors: Record<string, string> = {
    webgpu: 'bg-accent-green/20 text-accent-green',
    webgl: 'bg-primary/20 text-primary-light',
    cpu: 'bg-accent-amber/20 text-accent-amber',
  };

  return (
    <span
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${colors[backend || 'cpu'] || ''}`}
    >
      <Cpu size={12} />
      {backend?.toUpperCase() || 'No backend'}
    </span>
  );
}
