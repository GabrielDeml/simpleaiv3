interface EqProps {
  /** Math expression rendered with styled spans — use inline JSX */
  children: React.ReactNode;
  /** If true, displays as a centered block equation */
  block?: boolean;
}

/**
 * Styled math equation wrapper. Use font-mono spans inside for variables.
 * Block equations get a subtle background card treatment.
 */
export function Eq({ children, block }: EqProps) {
  if (block) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-6 py-4 rounded-xl bg-surface-light border border-white/[0.06] font-mono text-lg text-text tracking-wide">
          {children}
        </div>
      </div>
    );
  }
  return <span className="font-mono text-primary-light text-sm">{children}</span>;
}
