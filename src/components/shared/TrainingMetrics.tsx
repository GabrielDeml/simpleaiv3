interface TrainingMetricsProps {
  epoch: number;
  loss: number;
  accuracy?: number;
  isTraining: boolean;
}

export function TrainingMetrics({ epoch, loss, accuracy, isTraining }: TrainingMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3" aria-live="polite" role="status">
      <div className="bg-surface rounded-md p-3">
        <p className="text-xs text-text-muted">Epoch</p>
        <p className="text-lg font-mono text-text">{epoch}</p>
      </div>
      <div className="bg-surface rounded-md p-3">
        <p className="text-xs text-text-muted">Loss</p>
        <p className="text-lg font-mono text-text">{loss.toFixed(4)}</p>
      </div>
      {accuracy !== undefined && (
        <div className="bg-surface rounded-md p-3 col-span-2">
          <p className="text-xs text-text-muted">Accuracy</p>
          <p className="text-lg font-mono text-text">{(accuracy * 100).toFixed(1)}%</p>
        </div>
      )}
      {isTraining && (
        <div className="col-span-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-xs text-text-muted">Training...</span>
        </div>
      )}
    </div>
  );
}
