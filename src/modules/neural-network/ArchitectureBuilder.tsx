import { Plus, Trash2 } from 'lucide-react';
import { useNeuralNetworkStore } from '../../stores/useNeuralNetworkStore';
import type { NetworkLayer } from '../../ml/types';

const ACTIVATIONS: NetworkLayer['activation'][] = ['relu', 'sigmoid', 'tanh'];

export function ArchitectureBuilder() {
  const architecture = useNeuralNetworkStore((s) => s.architecture);
  const addLayer = useNeuralNetworkStore((s) => s.addLayer);
  const removeLayer = useNeuralNetworkStore((s) => s.removeLayer);
  const updateLayer = useNeuralNetworkStore((s) => s.updateLayer);
  const isTraining = useNeuralNetworkStore((s) => s.trainingState.isTraining);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Hidden Layers</h4>
        <button
          onClick={addLayer}
          disabled={isTraining || architecture.layers.length >= 6}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {architecture.layers.length === 0 && (
        <p className="text-xs text-text-muted italic">No hidden layers</p>
      )}

      <div className="space-y-2">
        {architecture.layers.map((layer, i) => (
          <div key={i} className="flex items-center gap-2 bg-surface rounded-lg p-2 border border-white/[0.04]">
            <span className="text-xs text-text-muted w-4">{i + 1}</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={16}
                value={layer.units}
                disabled={isTraining}
                onChange={(e) =>
                  updateLayer(i, {
                    units: Math.max(1, Math.min(16, parseInt(e.target.value) || 1)),
                  })
                }
                className="w-12 bg-surface-lighter rounded px-1.5 py-0.5 text-xs text-text text-center border border-border focus:border-primary outline-none"
              />
              <select
                value={layer.activation}
                disabled={isTraining}
                onChange={(e) =>
                  updateLayer(i, { activation: e.target.value as NetworkLayer['activation'] })
                }
                className="flex-1 bg-surface-lighter rounded px-1.5 py-0.5 text-xs text-text border border-border focus:border-primary outline-none"
              >
                {ACTIVATIONS.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeLayer(i)}
              disabled={isTraining}
              className="text-text-muted hover:text-red transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-text-muted pt-1">
        Input(2) →{' '}
        {architecture.layers.map((l) => `Dense(${l.units}, ${l.activation})`).join(' → ')}
        {architecture.layers.length > 0 ? ' → ' : ''}Output(1, sigmoid)
      </div>
    </div>
  );
}
