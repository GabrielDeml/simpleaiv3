import { type ReactNode } from 'react';

export function Prose({ children }: { children: ReactNode }) {
  return <div className="text-sm text-text-muted leading-relaxed space-y-3">{children}</div>;
}
