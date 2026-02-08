import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

export function PlayPauseButton({ isPlaying, onToggle, onReset, disabled }: PlayPauseButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(37,99,235,0.25)]"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      {onReset && (
        <button
          onClick={onReset}
          className="p-2.5 rounded-lg hover:bg-surface-lighter text-text-muted transition-colors"
          title="Reset"
          aria-label="Reset"
        >
          <RotateCcw size={16} />
        </button>
      )}
    </div>
  );
}
