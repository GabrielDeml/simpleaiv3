import { AlertTriangle, Download, Check, Cpu } from 'lucide-react';
import { useLLMStore } from '../../stores/useLLMStore';
import { MODEL_TIERS } from '../../ml/webllm-engine';
import type { ModelTier } from '../../ml/webllm-engine';

const TIER_ORDER: ModelTier[] = ['lite', 'standard', 'advanced'];

export function ModelSelector() {
  const {
    selectedTier,
    modelStatus,
    downloadProgress,
    downloadText,
    hasWebGPU,
    recommendedTier,
    error,
    setTier,
    loadModel,
  } = useLLMStore();

  const isLoading = modelStatus === 'downloading' || modelStatus === 'loading';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!hasWebGPU && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">WebGPU Not Available</p>
            <p className="text-xs text-text-muted mt-1">
              Your browser does not support WebGPU. LLM inference requires WebGPU. Try Chrome 113+
              or Edge 113+.
            </p>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-text">Select a Model</h2>
        <p className="text-sm text-text-muted">
          Choose a model tier based on your device capabilities. Models are downloaded and cached
          locally.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIER_ORDER.map((tier) => {
          const model = MODEL_TIERS[tier];
          const isSelected = selectedTier === tier;
          const isRecommended = recommendedTier === tier;

          return (
            <button
              key={tier}
              onClick={() => setTier(tier)}
              disabled={isLoading}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-light hover:border-surface-lighter'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-3 px-2 py-0.5 text-[10px] font-medium bg-green-500 text-white rounded-full">
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text">{model.tier}</span>
              </div>
              <p className="text-sm font-medium text-text">{model.name}</p>
              <p className="text-xs text-text-muted mt-1">{model.description}</p>
              <p className="text-xs text-text-muted mt-2 font-mono">{model.size}</p>
              {isSelected && <Check size={16} className="absolute top-3 right-3 text-primary" />}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.round(downloadProgress * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{downloadText}</span>
            <span>{Math.round(downloadProgress * 100)}%</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-500">Error</p>
            <p className="text-xs text-text-muted mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={loadModel}
          disabled={!hasWebGPU || isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-light text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isLoading ? 'Loading Model...' : 'Load Model'}
        </button>
      </div>
    </div>
  );
}
