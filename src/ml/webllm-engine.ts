import * as webllm from '@mlc-ai/web-llm';
import type { MLCEngineInterface } from '@mlc-ai/web-llm';
import type { LLMMessage, SamplingParams } from './types';

export const MODEL_TIERS = {
  lite: {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 0.5B',
    size: '~400MB',
    description: 'Works on most devices',
    tier: 'Lite' as const,
  },
  standard: {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    name: 'TinyLlama 1.1B',
    size: '~637MB',
    description: 'Good balance of quality and speed',
    tier: 'Standard' as const,
  },
  advanced: {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi-3.5 Mini 3.8B',
    size: '~1.8GB',
    description: 'Best quality, needs powerful device',
    tier: 'Advanced' as const,
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

// Note: Model IDs may need verification against current @mlc-ai/web-llm model list.
// Check webllm.prebuiltAppConfig.model_list for available models.
// Common alternatives if the above don't work:
// - 'Qwen2-0.5B-Instruct-q4f16_1-MLC'
// - 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
// - 'Phi-3-mini-4k-instruct-q4f16_1-MLC'

export function getAvailableModels(): string[] {
  return webllm.prebuiltAppConfig.model_list.map((m) => m.model_id);
}

export async function createEngine(
  onProgress?: (report: webllm.InitProgressReport) => void,
): Promise<webllm.MLCEngine> {
  const engine = new webllm.MLCEngine();
  if (onProgress) {
    engine.setInitProgressCallback(onProgress);
  }
  return engine;
}

export async function loadModel(
  engine: webllm.MLCEngine,
  modelId: string,
  onProgress?: (report: webllm.InitProgressReport) => void,
): Promise<void> {
  if (onProgress) {
    engine.setInitProgressCallback(onProgress);
  }
  await engine.reload(modelId);
}

export async function streamChat(
  engine: MLCEngineInterface,
  messages: LLMMessage[],
  samplingParams: SamplingParams,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await engine.chat.completions.create({
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: samplingParams.temperature,
    top_p: samplingParams.topP,
    max_tokens: samplingParams.maxTokens,
    stream: true,
  });

  let fullResponse = '';
  for await (const chunk of response) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      onToken(delta);
    }
  }
  return fullResponse;
}

export function detectDeviceCapability(): {
  hasWebGPU: boolean;
  recommendedTier: ModelTier;
} {
  const hasWebGPU = 'gpu' in navigator;

  // Use a heuristic based on device memory if available
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  let recommendedTier: ModelTier = 'lite';

  if (deviceMemory) {
    if (deviceMemory >= 8) {
      recommendedTier = 'advanced';
    } else if (deviceMemory >= 4) {
      recommendedTier = 'standard';
    }
  } else {
    // Default to standard if we can't detect memory
    recommendedTier = 'standard';
  }

  return { hasWebGPU, recommendedTier };
}
