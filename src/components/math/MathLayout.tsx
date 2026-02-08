import { type ReactNode } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

interface MathLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function MathLayout({ title, subtitle, children }: MathLayoutProps) {
  useDocumentTitle(title);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-text tracking-tight mb-2">{title}</h1>
          <p className="text-base text-text-muted leading-relaxed">{subtitle}</p>
        </header>
        <div className="space-y-16">{children}</div>
        <div className="mt-16 pt-8 border-t border-border/50" />
      </div>
    </div>
  );
}
