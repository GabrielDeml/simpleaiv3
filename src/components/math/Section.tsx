import { type ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-text mb-4 tracking-tight">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
