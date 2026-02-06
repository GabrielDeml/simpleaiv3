import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { useLLMStore } from '../../stores/useLLMStore';
import { ModelSelector } from './ModelSelector';
import { ChatInterface } from './ChatInterface';
import { SamplingControls } from './SamplingControls';
import { TokenVisualizer } from './TokenVisualizer';
import { TokenProbabilities } from './TokenProbabilities';
import { MODEL_TIERS } from '../../ml/webllm-engine';

const LEARN_MORE =
  'Large Language Models generate text token by token. Each token is chosen by sampling ' +
  'from a probability distribution over the vocabulary. Temperature, top-k, and top-p control ' +
  'how that sampling works. This playground runs a quantized LLM entirely in your browser ' +
  'using WebGPU via the WebLLM library -- no data leaves your device.';

export default function LLMPage() {
  const { modelStatus, selectedTier } = useLLMStore();
  const isReady = modelStatus === 'ready';
  const modelName = MODEL_TIERS[selectedTier].name;

  const controls = isReady ? (
    <div className="space-y-6">
      <div className="bg-surface rounded-md p-3">
        <p className="text-xs text-text-muted">Active Model</p>
        <p className="text-sm font-medium text-text mt-0.5">{modelName}</p>
      </div>
      <SamplingControls />
      <TokenProbabilities />
      <TokenVisualizer />
    </div>
  ) : undefined;

  return (
    <ModuleLayout
      title="LLM Playground"
      description="Chat with an LLM running entirely in your browser"
      learnMore={LEARN_MORE}
      controls={controls}
    >
      {isReady ? (
        <ChatInterface />
      ) : (
        <div className="flex items-center justify-center h-full">
          <ModelSelector />
        </div>
      )}
    </ModuleLayout>
  );
}
