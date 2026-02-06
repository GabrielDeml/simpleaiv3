import { RotateCcw } from 'lucide-react';
import { ParameterPanel } from '../../components/shared/ParameterPanel';
import { ParameterSlider } from '../../components/shared/ParameterSlider';
import { useLLMStore } from '../../stores/useLLMStore';

const DEFAULTS = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxTokens: 512,
};

export function SamplingControls() {
  const { samplingParams, setSamplingParams, messages, reset } = useLLMStore();

  return (
    <div className="space-y-6">
      <ParameterPanel title="Sampling Parameters">
        <ParameterSlider
          label="Temperature"
          value={samplingParams.temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => setSamplingParams({ temperature: v })}
          format={(v) => v.toFixed(1)}
        />
        <p className="text-[11px] text-text-muted -mt-2">
          Controls randomness. Higher = more creative, lower = more focused.
        </p>

        <ParameterSlider
          label="Top-K"
          value={samplingParams.topK}
          min={1}
          max={100}
          step={1}
          onChange={(v) => setSamplingParams({ topK: v })}
        />
        <p className="text-[11px] text-text-muted -mt-2">
          Limits to top K most likely tokens at each step.
        </p>

        <ParameterSlider
          label="Top-P"
          value={samplingParams.topP}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setSamplingParams({ topP: v })}
          format={(v) => v.toFixed(2)}
        />
        <p className="text-[11px] text-text-muted -mt-2">
          Nucleus sampling. Considers smallest set of tokens with cumulative probability {'>='} P.
        </p>

        <ParameterSlider
          label="Max Tokens"
          value={samplingParams.maxTokens}
          min={64}
          max={2048}
          step={64}
          onChange={(v) => setSamplingParams({ maxTokens: v })}
        />
        <p className="text-[11px] text-text-muted -mt-2">
          Maximum number of tokens to generate in a response.
        </p>
      </ParameterPanel>

      <div className="space-y-2">
        <button
          onClick={() => setSamplingParams(DEFAULTS)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-surface-lighter hover:bg-border text-text text-sm font-medium transition-colors"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>

        {messages.length > 0 && (
          <button
            onClick={reset}
            className="w-full px-4 py-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/30"
          >
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}
