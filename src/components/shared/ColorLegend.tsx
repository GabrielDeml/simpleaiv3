interface LegendItem {
  label: string;
  color: string;
}

interface ColorLegendProps {
  items: LegendItem[];
}

export function ColorLegend({ items }: ColorLegendProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
