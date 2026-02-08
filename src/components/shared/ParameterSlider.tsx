interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: ParameterSliderProps) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="text-text-muted">
          {label}
        </label>
        <span className="text-text font-mono text-xs">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--slider-fill': `${percent}%` } as React.CSSProperties}
        className="w-full cursor-pointer slider-filled"
      />
    </div>
  );
}
