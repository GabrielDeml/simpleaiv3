import { type ReactNode } from 'react';

interface InteractiveDemoProps {
  title: string;
  children: ReactNode;
}

/**
 * Card wrapper for interactive demos within math pages.
 * Provides a visual boundary and title for the playground area.
 */
export function InteractiveDemo({ title, children }: InteractiveDemoProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-surface-light/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-primary/10 bg-primary/5">
        <h3 className="text-xs font-semibold text-primary-light uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
