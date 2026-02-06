export interface Point2D {
  x: number;
  y: number;
  label?: number;
}

export interface TrainingConfig {
  learningRate: number;
  epochs: number;
  batchSize: number;
}

export interface TrainingState {
  isTraining: boolean;
  epoch: number;
  loss: number;
  accuracy?: number;
}

export interface NetworkLayer {
  units: number;
  activation: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';
}

export interface NetworkArchitecture {
  inputSize: number;
  layers: NetworkLayer[];
  outputSize: number;
  outputActivation: 'sigmoid' | 'softmax';
}

export interface Prediction {
  className: string;
  probability: number;
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TokenInfo {
  token: string;
  id: number;
  probability?: number;
}

export interface SamplingParams {
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
}

export type DatasetType = 'circle' | 'spiral' | 'xor' | 'gaussian' | 'moons';
