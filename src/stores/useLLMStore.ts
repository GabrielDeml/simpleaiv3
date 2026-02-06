import { create } from 'zustand';
import { WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import { MODEL_TIERS, detectDeviceCapability, streamChat } from '../ml/webllm-engine';
import type { ModelTier } from '../ml/webllm-engine';
import type { LLMMessage, SamplingParams, TokenInfo } from '../ml/types';

type ModelStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

interface LLMState {
  modelStatus: ModelStatus;
  downloadProgress: number;
  downloadText: string;
  selectedTier: ModelTier;
  messages: LLMMessage[];
  isGenerating: boolean;
  currentResponse: string;
  samplingParams: SamplingParams;
  tokenProbabilities: TokenInfo[];
  tokenizedInput: TokenInfo[];
  hasWebGPU: boolean;
  recommendedTier: ModelTier;
  error: string | null;

  setTier: (tier: ModelTier) => void;
  loadModel: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopGenerating: () => void;
  setSamplingParams: (params: Partial<SamplingParams>) => void;
  setTokenProbabilities: (tokens: TokenInfo[]) => void;
  reset: () => void;
}

const DEFAULT_SAMPLING: SamplingParams = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxTokens: 512,
};

let engine: WebWorkerMLCEngine | null = null;
let currentWorker: Worker | null = null;
let abortController: AbortController | null = null;

const { hasWebGPU, recommendedTier } = detectDeviceCapability();

async function cleanupEngine() {
  if (engine) {
    try {
      engine.interruptGenerate();
      await engine.unload();
    } catch {
      // Ignore cleanup errors
    }
    engine = null;
  }
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
}

export const useLLMStore = create<LLMState>((set, get) => ({
  modelStatus: 'idle',
  downloadProgress: 0,
  downloadText: '',
  selectedTier: recommendedTier,
  messages: [],
  isGenerating: false,
  currentResponse: '',
  samplingParams: { ...DEFAULT_SAMPLING },
  tokenProbabilities: [],
  tokenizedInput: [],
  hasWebGPU,
  recommendedTier,
  error: null,

  setTier: (tier) => set({ selectedTier: tier }),

  loadModel: async () => {
    const { selectedTier } = get();
    const modelInfo = MODEL_TIERS[selectedTier];

    set({
      modelStatus: 'downloading',
      downloadProgress: 0,
      downloadText: 'Initializing...',
      error: null,
    });

    try {
      // Clean up any previous engine/worker before creating new ones
      await cleanupEngine();

      const worker = new Worker(new URL('../workers/llm.worker.ts', import.meta.url), {
        type: 'module',
      });
      currentWorker = worker;

      const progressCallback = (report: InitProgressReport) => {
        const progress = report.progress ?? 0;
        set({
          downloadProgress: progress,
          downloadText: report.text,
          modelStatus: progress < 1 ? 'downloading' : 'loading',
        });
      };

      engine = new WebWorkerMLCEngine(worker, {
        initProgressCallback: progressCallback,
      });

      await engine.reload(modelInfo.id);

      set({ modelStatus: 'ready', downloadProgress: 1, downloadText: 'Model ready' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model';
      set({ modelStatus: 'error', error: message });
      await cleanupEngine();
    }
  },

  sendMessage: async (content) => {
    if (!engine || get().isGenerating) return;

    const userMessage: LLMMessage = { role: 'user', content };
    const messages = [...get().messages, userMessage];

    set({
      messages,
      isGenerating: true,
      currentResponse: '',
      error: null,
    });

    abortController = new AbortController();

    try {
      const assistantContent = await streamChat(engine, messages, get().samplingParams, (token) => {
        if (abortController?.signal.aborted) return;
        set((s) => ({ currentResponse: s.currentResponse + token }));
      });

      if (!abortController.signal.aborted) {
        const assistantMessage: LLMMessage = { role: 'assistant', content: assistantContent };
        set((s) => ({
          messages: [...s.messages, assistantMessage],
          currentResponse: '',
          isGenerating: false,
        }));
      }
    } catch (err) {
      if (!abortController?.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        set({ error: message, isGenerating: false });
      }
    }
  },

  stopGenerating: () => {
    abortController?.abort();
    // Actually interrupt the WebLLM engine's generation
    engine?.interruptGenerate();
    const { currentResponse, messages } = get();
    if (currentResponse) {
      const assistantMessage: LLMMessage = { role: 'assistant', content: currentResponse };
      set({
        messages: [...messages, assistantMessage],
        currentResponse: '',
        isGenerating: false,
      });
    } else {
      set({ isGenerating: false });
    }
  },

  setSamplingParams: (params) =>
    set((s) => ({ samplingParams: { ...s.samplingParams, ...params } })),

  setTokenProbabilities: (tokens) => set({ tokenProbabilities: tokens }),

  reset: () => {
    abortController?.abort();
    engine?.interruptGenerate();
    set({
      messages: [],
      isGenerating: false,
      currentResponse: '',
      tokenProbabilities: [],
      tokenizedInput: [],
      error: null,
    });
  },
}));
