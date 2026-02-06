import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, X, Camera, CameraOff, Play, RotateCcw } from 'lucide-react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { TrainingMetrics } from '../../components/shared/TrainingMetrics';
import { useTransferLearningStore } from '../../stores/useTransferLearningStore';
import { useWebcam } from '../../hooks/useWebcam';
import { COLORS } from '../../config/constants';

function PredictionBar({
  category,
  confidence,
  color,
}: {
  category: string;
  confidence: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text">{category}</span>
        <span className="text-text-muted font-mono">{(confidence * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-surface-lighter rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${confidence * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function TransferLearningPage() {
  const store = useTransferLearningStore();
  const webcam = useWebcam();
  const [newCategory, setNewCategory] = useState('');
  const collectIntervalRef = useRef<number | null>(null);
  const predictIntervalRef = useRef<number | null>(null);

  const canTrain =
    store.categories.length >= 2 &&
    store.categories.every((c) => (store.samples[c]?.length ?? 0) >= 5);

  const handleAddCategory = useCallback(() => {
    if (newCategory.trim()) {
      store.addCategory(newCategory);
      setNewCategory('');
    }
  }, [newCategory, store]);

  const handleStartCollecting = useCallback(() => {
    if (!webcam.isActive || !store.activeCategory) return;
    store.setCollecting(true);
    collectIntervalRef.current = window.setInterval(() => {
      const imageData = webcam.capture();
      if (!imageData || !store.activeCategory) return;
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(imageData, 0, 0);
      store.addSample(store.activeCategory, canvas.toDataURL('image/jpeg', 0.7), imageData);
    }, 200);
  }, [webcam, store]);

  const handleStopCollecting = useCallback(() => {
    store.setCollecting(false);
    if (collectIntervalRef.current) {
      clearInterval(collectIntervalRef.current);
      collectIntervalRef.current = null;
    }
  }, [store]);

  const handleStartPredicting = useCallback(() => {
    if (!webcam.isActive || store.modelStatus !== 'ready') return;
    predictIntervalRef.current = window.setInterval(() => {
      const imageData = webcam.capture();
      if (imageData) store.predict(imageData);
    }, 500);
  }, [webcam, store]);

  useEffect(() => {
    return () => {
      if (collectIntervalRef.current) clearInterval(collectIntervalRef.current);
      if (predictIntervalRef.current) clearInterval(predictIntervalRef.current);
    };
  }, []);

  const handleReset = useCallback(() => {
    handleStopCollecting();
    if (predictIntervalRef.current) {
      clearInterval(predictIntervalRef.current);
      predictIntervalRef.current = null;
    }
    if (webcam.isActive) webcam.stop();
    store.reset();
  }, [store, webcam, handleStopCollecting]);

  return (
    <ModuleLayout
      title="Transfer Learning"
      description="Train a custom image classifier using your webcam"
      learnMore="Transfer learning reuses a pre-trained model (MobileNet) as a feature extractor and trains a small classification head on your custom categories. This allows you to build accurate classifiers with just a few dozen samples per class."
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => (webcam.isActive ? webcam.stop() : webcam.start())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-surface-light border border-border hover:border-primary/50 text-text-muted hover:text-text transition-colors"
            >
              {webcam.isActive ? <CameraOff size={14} /> : <Camera size={14} />}
              {webcam.isActive ? 'Stop Webcam' : 'Start Webcam'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-surface-light border border-border hover:border-primary/50 text-text-muted hover:text-text transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          {store.error && <p className="text-xs text-red-400">{store.error}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Webcam + Controls */}
          <div className="space-y-4">
            {/* Webcam feed */}
            {webcam.isActive && (
              <div className="rounded-lg overflow-hidden bg-surface border border-border">
                <video ref={webcam.videoRef} className="w-full" autoPlay playsInline muted />
              </div>
            )}
            {webcam.error && <p className="text-xs text-red-400">{webcam.error}</p>}

            {/* Step 1: Define Categories */}
            <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
              <h3 className="text-sm font-semibold text-text">1. Define Categories</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Category name..."
                  className="flex-1 px-3 py-1.5 text-sm bg-surface-light border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary hover:bg-primary-light text-white transition-colors"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {store.categories.map((cat, i) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white"
                    style={{
                      backgroundColor: COLORS.classColors[i % COLORS.classColors.length] + '80',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.classColors[i % COLORS.classColors.length] }}
                    />
                    {cat} ({store.samples[cat]?.length ?? 0})
                    <button
                      onClick={() => store.removeCategory(cat)}
                      className="hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Step 2: Collect Samples */}
            {store.categories.length >= 2 && (
              <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
                <h3 className="text-sm font-semibold text-text">2. Collect Samples</h3>
                <p className="text-xs text-text-muted">
                  Select a category and hold to collect webcam samples (min 5 each)
                </p>
                <div className="flex flex-wrap gap-2">
                  {store.categories.map((cat, i) => (
                    <button
                      key={cat}
                      onClick={() =>
                        store.setActiveCategory(store.activeCategory === cat ? null : cat)
                      }
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        store.activeCategory === cat
                          ? 'border-primary bg-primary/20 text-text'
                          : 'border-border bg-surface-light text-text-muted hover:text-text'
                      }`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{
                          backgroundColor: COLORS.classColors[i % COLORS.classColors.length],
                        }}
                      />
                      {cat} ({store.samples[cat]?.length ?? 0})
                    </button>
                  ))}
                </div>
                {store.activeCategory && webcam.isActive && (
                  <button
                    onMouseDown={handleStartCollecting}
                    onMouseUp={handleStopCollecting}
                    onMouseLeave={handleStopCollecting}
                    onTouchStart={handleStartCollecting}
                    onTouchEnd={handleStopCollecting}
                    className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${
                      store.isCollecting
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-primary hover:bg-primary-light text-white'
                    }`}
                  >
                    {store.isCollecting
                      ? `Collecting "${store.activeCategory}"...`
                      : `Hold to Collect "${store.activeCategory}"`}
                  </button>
                )}
                {store.activeCategory && !webcam.isActive && (
                  <p className="text-xs text-amber-400">Start the webcam to collect samples</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Train + Predict */}
          <div className="space-y-4">
            {/* Sample Gallery */}
            {store.categories.length > 0 && (
              <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
                <h3 className="text-sm font-semibold text-text">Sample Gallery</h3>
                {store.categories.map((cat, catIdx) => (
                  <div key={cat} className="space-y-1">
                    <p className="text-xs text-text-muted flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS.classColors[catIdx % COLORS.classColors.length],
                        }}
                      />
                      {cat}: {store.samples[cat]?.length ?? 0} samples
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {(store.samples[cat] || []).slice(0, 10).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${cat} sample ${i}`}
                          className="w-10 h-10 object-cover rounded border border-border"
                        />
                      ))}
                      {(store.samples[cat]?.length ?? 0) > 10 && (
                        <span className="w-10 h-10 flex items-center justify-center text-xs text-text-muted bg-surface-light rounded border border-border">
                          +{(store.samples[cat]?.length ?? 0) - 10}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Train */}
            {store.categories.length >= 2 && (
              <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
                <h3 className="text-sm font-semibold text-text">3. Train Model</h3>
                <button
                  onClick={() => store.startTraining()}
                  disabled={
                    !canTrain || store.modelStatus === 'training' || store.modelStatus === 'loading'
                  }
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Play size={14} />
                  {store.modelStatus === 'loading'
                    ? 'Loading MobileNet...'
                    : store.modelStatus === 'training'
                      ? 'Training...'
                      : 'Train'}
                </button>
                {!canTrain && store.categories.length >= 2 && (
                  <p className="text-xs text-amber-400">Need at least 5 samples per category</p>
                )}
                {store.trainingState.epoch > 0 && (
                  <TrainingMetrics
                    epoch={store.trainingState.epoch}
                    loss={store.trainingState.loss}
                    accuracy={store.trainingState.accuracy}
                    isTraining={store.trainingState.isTraining}
                  />
                )}
              </div>
            )}

            {/* Step 4: Predict */}
            {store.modelStatus === 'ready' && (
              <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
                <h3 className="text-sm font-semibold text-text">4. Live Prediction</h3>
                {webcam.isActive ? (
                  <>
                    <button
                      onClick={() => {
                        if (predictIntervalRef.current) {
                          clearInterval(predictIntervalRef.current);
                          predictIntervalRef.current = null;
                        } else {
                          handleStartPredicting();
                        }
                      }}
                      className="w-full py-2 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
                    >
                      {predictIntervalRef.current ? 'Stop Predicting' : 'Start Live Prediction'}
                    </button>
                    {store.prediction && (
                      <div className="space-y-2">
                        <div className="text-center py-2">
                          <p className="text-lg font-bold text-text">{store.prediction.category}</p>
                          <p className="text-sm text-text-muted">
                            {(store.prediction.confidence * 100).toFixed(1)}% confidence
                          </p>
                        </div>
                        {store.prediction.all.map((p) => (
                          <PredictionBar
                            key={p.category}
                            category={p.category}
                            confidence={p.confidence}
                            color={
                              COLORS.classColors[
                                store.categories.indexOf(p.category) % COLORS.classColors.length
                              ]
                            }
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-text-muted">
                    Start the webcam to run live predictions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
