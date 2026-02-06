import { useState } from 'react';
import { ParameterPanel } from '../../components/shared/ParameterPanel';

function hashColor(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = token.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

function simpleTokenize(text: string): string[] {
  if (!text) return [];
  // Split on word boundaries, keeping whitespace and punctuation as separate tokens
  const tokens: string[] = [];
  const regex = /(\s+|[^\s\w]|\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

export function TokenVisualizer() {
  const [text, setText] = useState('');
  const tokens = simpleTokenize(text);

  return (
    <ParameterPanel title="Token Visualizer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste text to see a token breakdown..."
        rows={3}
        className="w-full resize-none rounded-md bg-surface border border-border px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
      />

      {tokens.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Approximate tokens</span>
            <span className="font-mono">{tokens.length}</span>
          </div>
          <div className="flex flex-wrap gap-0.5 p-3 rounded-md bg-surface border border-border min-h-[48px]">
            {tokens.map((token, i) => (
              <span
                key={i}
                className="px-1 py-0.5 rounded text-xs font-mono text-white"
                style={{ backgroundColor: hashColor(token) }}
                title={`Token: "${token}"`}
              >
                {token.replace(/ /g, '\u00B7').replace(/\n/g, '\u21B5')}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">
            Note: This is an approximate visualization using whitespace/punctuation splitting.
            Actual LLM tokenization (BPE) may differ.
          </p>
        </div>
      )}
    </ParameterPanel>
  );
}
