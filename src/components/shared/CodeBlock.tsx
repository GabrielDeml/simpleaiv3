interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  return (
    <div className="relative rounded-lg bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-lighter">
        <span className="text-xs text-text-muted">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-text">{code}</code>
      </pre>
    </div>
  );
}
