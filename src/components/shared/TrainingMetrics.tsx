interface TrainingMetricsProps {
  epoch: number;
  loss: number;
  accuracy?: number;
  isTraining: boolean;
}

export function TrainingMetrics({ epoch, loss, accuracy, isTraining }: TrainingMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3" aria-live="polite" role="status">
      <div className="bg-surface rounded-lg p-3 border border-white/[0.04]">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">Epoch</p>
        <p className="text-lg font-mono text-text tabular-nums">{epoch}</p>
      </div>
      <div className="bg-surface rounded-lg p-3 border border-white/[0.04]">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">Loss</p>
        <p className="text-lg font-mono text-text tabular-nums">{loss.toFixed(4)}</p>
      </div>
      {accuracy !== undefined && (
        <div className="bg-surface rounded-lg p-3 col-span-2 border border-white/[0.04]">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Accuracy</p>
          <p className="text-lg font-mono text-text tabular-nums">{(accuracy * 100).toFixed(1)}%</p>
        </div>
      )}
      {isTraining && (
        <div className="col-span-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-xs text-text-muted">Training...</span>
        </div>
      )}
    </div>
  );
}
