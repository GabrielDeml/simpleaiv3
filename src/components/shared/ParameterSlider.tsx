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
        className="w-full accent-primary h-1.5 bg-surface-lighter rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}
