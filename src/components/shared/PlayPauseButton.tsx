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
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      {onReset && (
        <button
          onClick={onReset}
          className="p-2 rounded-md hover:bg-surface-lighter text-text-muted transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      )}
    </div>
  );
}
