import { useLLMStore } from '../../stores/useLLMStore';
import { ParameterPanel } from '../../components/shared/ParameterPanel';

const BAR_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#6366f1',
];

export function TokenProbabilities() {
  const { tokenProbabilities } = useLLMStore();

  if (tokenProbabilities.length === 0) {
    return (
      <ParameterPanel title="Token Probabilities">
        <p className="text-xs text-text-muted">
          Next-token probability distribution will appear here during generation, if supported by
          the model. WebLLM may not expose per-token logprobs in all configurations.
        </p>
      </ParameterPanel>
    );
  }

  const maxProb = Math.max(...tokenProbabilities.map((t) => t.probability ?? 0));

  return (
    <ParameterPanel title="Token Probabilities">
      <div className="space-y-1.5">
        {tokenProbabilities.map((token, i) => {
          const prob = token.probability ?? 0;
          const width = maxProb > 0 ? (prob / maxProb) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-20 truncate font-mono text-text" title={token.token}>
                {token.token}
              </span>
              <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${width}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
              <span className="w-12 text-right font-mono text-text-muted">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </ParameterPanel>
  );
}
