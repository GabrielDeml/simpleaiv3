import { useEffect, useCallback, useRef } from 'react';
import * as Comlink from 'comlink';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { ParameterPanel } from '../../components/shared/ParameterPanel';
import { ParameterSlider } from '../../components/shared/ParameterSlider';
import { PlayPauseButton } from '../../components/shared/PlayPauseButton';
import { TrainingMetrics } from '../../components/shared/TrainingMetrics';
import { useNeuralNetworkStore } from '../../stores/useNeuralNetworkStore';
import { useTrainingWorker } from '../../hooks/useTrainingWorker';
import { DecisionBoundaryCanvas } from './DecisionBoundaryCanvas';
import { NetworkDiagram } from './NetworkDiagram';
import { DatasetSelector } from './DatasetSelector';
import { ArchitectureBuilder } from './ArchitectureBuilder';
import type { NeuralNetworkWorkerAPI } from '../../workers/neural-network.worker';

const RANGE_X: [number, number] = [-1.5, 1.5];
const RANGE_Y: [number, number] = [-1.5, 1.5];

const createWorker = () =>
  new Worker(new URL('../../workers/neural-network.worker.ts', import.meta.url), {
    type: 'module',
  });

export default function NeuralNetworkPage() {
  const { worker, terminate } = useTrainingWorker<NeuralNetworkWorkerAPI>(createWorker);
  const initedRef = useRef(false);
  const trainingLoopRef = useRef(false);

  const points = useNeuralNetworkStore((s) => s.points);
  const datasetType = useNeuralNetworkStore((s) => s.datasetType);
  const numPoints = useNeuralNetworkStore((s) => s.numPoints);
  const trainingState = useNeuralNetworkStore((s) => s.trainingState);
  const learningRate = useNeuralNetworkStore((s) => s.learningRate);
  const boundaryResolution = useNeuralNetworkStore((s) => s.boundaryResolution);
  const currentLabel = useNeuralNetworkStore((s) => s.currentLabel);

  const setDataset = useNeuralNetworkStore((s) => s.setDataset);
  const setNumPoints = useNeuralNetworkStore((s) => s.setNumPoints);
  const setLearningRate = useNeuralNetworkStore((s) => s.setLearningRate);
  const startTraining = useNeuralNetworkStore((s) => s.startTraining);
  const stopTraining = useNeuralNetworkStore((s) => s.stopTraining);
  const updateTrainingState = useNeuralNetworkStore((s) => s.updateTrainingState);
  const updateBoundary = useNeuralNetworkStore((s) => s.updateBoundary);
  const updateWeights = useNeuralNetworkStore((s) => s.updateWeights);
  const setCurrentLabel = useNeuralNetworkStore((s) => s.setCurrentLabel);
  const reset = useNeuralNetworkStore((s) => s.reset);

  // Initialize worker
  useEffect(() => {
    const api = worker.current;
    if (!api || initedRef.current) return;
    initedRef.current = true;
    api.init().catch(() => {});
  }, [worker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      terminate();
      stopTraining();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTraining = useCallback(async () => {
    const api = worker.current;
    if (!api) return;

    if (trainingState.isTraining) {
      api.stop();
      stopTraining();
      trainingLoopRef.current = false;
      return;
    }

    const store = useNeuralNetworkStore.getState();
    const xs = store.points.map((p) => [p.x, p.y]);
    const ys = store.points.map((p) => p.label ?? 0);

    if (xs.length === 0) return;

    // Create model with current architecture
    await api.createModel(store.architecture);
    startTraining();
    trainingLoopRef.current = true;

    // Training loop: train in batches, updating boundary between batches
    const runLoop = async () => {
      while (trainingLoopRef.current) {
        const currentStore = useNeuralNetworkStore.getState();
        if (!currentStore.trainingState.isTraining) break;

        try {
          await api.train(
            xs,
            ys,
            {
              learningRate: currentStore.learningRate,
              epochs: 10,
              batchSize: xs.length,
            },
            Comlink.proxy((progress: { epoch: number; loss: number; accuracy: number }) => {
              const prevEpoch = useNeuralNetworkStore.getState().trainingState.epoch;
              updateTrainingState({
                epoch: prevEpoch + 1,
                loss: progress.loss,
                accuracy: progress.accuracy,
              });
            }),
          );

          // Update decision boundary
          const boundary = await api.predictGrid(currentStore.boundaryResolution, RANGE_X, RANGE_Y);
          updateBoundary(boundary);

          // Update weights for diagram
          const weights = await api.getWeights();
          updateWeights(weights);
        } catch {
          break;
        }
      }
    };

    runLoop();
  }, [
    worker,
    trainingState.isTraining,
    startTraining,
    stopTraining,
    updateTrainingState,
    updateBoundary,
    updateWeights,
  ]);

  const handleReset = useCallback(() => {
    const api = worker.current;
    if (api) {
      api.stop();
      api.dispose();
    }
    trainingLoopRef.current = false;
    reset();
  }, [worker, reset]);

  const handleDatasetChange = useCallback(
    (type: typeof datasetType) => {
      const api = worker.current;
      if (api) {
        api.stop();
        api.dispose();
      }
      trainingLoopRef.current = false;
      setDataset(type);
    },
    [worker, setDataset],
  );

  const controls = (
    <div className="space-y-6">
      <DatasetSelector selected={datasetType} onSelect={handleDatasetChange} />

      <ParameterPanel title="Architecture">
        <ArchitectureBuilder />
      </ParameterPanel>

      <ParameterPanel title="Training">
        <ParameterSlider
          label="Learning Rate"
          value={learningRate}
          min={0.001}
          max={0.3}
          step={0.001}
          onChange={setLearningRate}
          format={(v) => v.toFixed(3)}
        />
        <ParameterSlider
          label="Data Points"
          value={numPoints}
          min={50}
          max={500}
          step={10}
          onChange={setNumPoints}
          format={(v) => String(Math.round(v))}
        />
        <ParameterSlider
          label="Grid Resolution"
          value={boundaryResolution}
          min={20}
          max={80}
          step={5}
          onChange={(v) => useNeuralNetworkStore.setState({ boundaryResolution: v })}
          format={(v) => `${v}x${v}`}
        />
      </ParameterPanel>

      <ParameterPanel title="Controls">
        <PlayPauseButton
          isPlaying={trainingState.isTraining}
          onToggle={handleToggleTraining}
          onReset={handleReset}
          disabled={points.length === 0}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-text-muted">Click label:</span>
          <button
            onClick={() => setCurrentLabel(0)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              currentLabel === 0 ? 'border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: '#3b82f6' }}
            title="Class 0"
          />
          <button
            onClick={() => setCurrentLabel(1)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              currentLabel === 1 ? 'border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: '#ef4444' }}
            title="Class 1"
          />
        </div>
      </ParameterPanel>

      <ParameterPanel title="Metrics">
        <TrainingMetrics
          epoch={trainingState.epoch}
          loss={trainingState.loss}
          accuracy={trainingState.accuracy}
          isTraining={trainingState.isTraining}
        />
      </ParameterPanel>
    </div>
  );

  return (
    <ModuleLayout
      title="Neural Network Playground"
      description="Build and train neural networks interactively. Visualize decision boundaries in real time."
      learnMore="A neural network learns to classify data by adjusting weights through backpropagation. The decision boundary shows how the network partitions the input space. Try different architectures and datasets to see how network depth and width affect learning."
      controls={controls}
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 min-h-0">
          <DecisionBoundaryCanvas />
        </div>
        <div className="h-36 shrink-0 bg-surface-light rounded-lg p-2 border border-white/[0.06] overflow-hidden">
          <NetworkDiagram />
        </div>
      </div>
    </ModuleLayout>
  );
}
