import { useRef, useEffect } from 'react';
import type { DatasetType } from '../../ml/types';
import { COLORS } from '../../config/constants';

const datasets: { type: DatasetType; label: string }[] = [
  { type: 'circle', label: 'Circle' },
  { type: 'spiral', label: 'Spiral' },
  { type: 'xor', label: 'XOR' },
  { type: 'gaussian', label: 'Gaussian' },
  { type: 'moons', label: 'Moons' },
];

function drawPreview(canvas: HTMLCanvasElement, type: DatasetType) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const patterns: Record<DatasetType, () => void> = {
    circle: () => {
      for (let i = 0; i < 40; i++) {
        const label = i < 20 ? 0 : 1;
        const r = label === 0 ? Math.random() * 0.3 : 0.35 + Math.random() * 0.15;
        const angle = Math.random() * Math.PI * 2;
        const x = w / 2 + r * w * Math.cos(angle);
        const y = h / 2 + r * h * Math.sin(angle);
        ctx.fillStyle = label === 0 ? COLORS.classColors[0] : COLORS.classColors[1];
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    spiral: () => {
      for (let c = 0; c < 2; c++) {
        for (let i = 0; i < 20; i++) {
          const r = (i / 20) * 0.4;
          const t = (i / 20) * 2 * Math.PI + c * Math.PI;
          const x = w / 2 + r * w * Math.cos(t);
          const y = h / 2 + r * h * Math.sin(t);
          ctx.fillStyle = c === 0 ? COLORS.classColors[0] : COLORS.classColors[1];
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    xor: () => {
      for (let i = 0; i < 40; i++) {
        const x = Math.random();
        const y = Math.random();
        const label = x > 0.5 !== y > 0.5 ? 1 : 0;
        ctx.fillStyle = label === 0 ? COLORS.classColors[0] : COLORS.classColors[1];
        ctx.beginPath();
        ctx.arc(x * w, y * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    gaussian: () => {
      const centers = [
        [0.35, 0.35],
        [0.65, 0.65],
      ];
      for (let c = 0; c < 2; c++) {
        for (let i = 0; i < 20; i++) {
          const x = centers[c][0] + (Math.random() - 0.5) * 0.25;
          const y = centers[c][1] + (Math.random() - 0.5) * 0.25;
          ctx.fillStyle = c === 0 ? COLORS.classColors[0] : COLORS.classColors[1];
          ctx.beginPath();
          ctx.arc(x * w, y * h, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    moons: () => {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI;
        const x = 0.3 + Math.cos(angle) * 0.2;
        const y = 0.4 + Math.sin(angle) * 0.2;
        ctx.fillStyle = COLORS.classColors[0];
        ctx.beginPath();
        ctx.arc(x * w, y * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI;
        const x = 0.5 + (1 - Math.cos(angle)) * 0.2;
        const y = 0.55 - Math.sin(angle) * 0.2;
        ctx.fillStyle = COLORS.classColors[1];
        ctx.beginPath();
        ctx.arc(x * w, y * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  patterns[type]();
}

function PreviewCanvas({ type }: { type: DatasetType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawPreview(canvas, type);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={40}
      className="rounded bg-surface"
      role="img"
      aria-label={`${type} dataset preview`}
    />
  );
}

interface DatasetSelectorProps {
  selected: DatasetType;
  onSelect: (type: DatasetType) => void;
}

export function DatasetSelector({ selected, onSelect }: DatasetSelectorProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs text-text-muted uppercase tracking-wider">Dataset</h4>
      <div className="grid grid-cols-5 gap-1.5">
        {datasets.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-md border transition-colors ${
              selected === type
                ? 'border-primary bg-primary/10'
                : 'border-transparent hover:bg-surface-lighter'
            }`}
          >
            <PreviewCanvas type={type} />
            <span className="text-[10px] text-text-muted">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
