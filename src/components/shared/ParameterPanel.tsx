import type { ReactNode } from 'react';

interface ParameterPanelProps {
  title: string;
  children: ReactNode;
}

export function ParameterPanel({ title, children }: ParameterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
