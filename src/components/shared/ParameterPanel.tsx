import type { ReactNode } from 'react';

interface ParameterPanelProps {
  title: string;
  children: ReactNode;
}

export function ParameterPanel({ title, children }: ParameterPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text uppercase tracking-wider">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
