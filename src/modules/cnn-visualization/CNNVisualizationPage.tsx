import { useEffect, useCallback, useRef } from 'react';
import { Camera, CameraOff, RotateCcw, Loader } from 'lucide-react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { ImageDropzone } from '../../components/shared/ImageDropzone';
import { useCNNVisualizerStore } from '../../stores/useCNNVisualizerStore';
import { useWebcam } from '../../hooks/useWebcam';

function MiniCanvas({ imageData, size = 48 }: { imageData: ImageData; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded border border-border"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      role="img"
      aria-label="CNN filter visualization"
    />
  );
}

export default function CNNVisualizationPage() {
  const store = useCNNVisualizerStore();
  const webcam = useWebcam();
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    store.loadModel();
  }, [store.loadModel]);

  // When layer changes, recompute if we have an input
  useEffect(() => {
    if (store.selectedLayer && store.modelStatus === 'ready') {
      store.computeFilters();
      if (imgRef.current) {
        store.computeActivations(imgRef.current);
      }
    }
    // Only re-run when selectedLayer changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.selectedLayer]);

  const handleImageLoad = useCallback(
    (img: HTMLImageElement) => {
      imgRef.current = img;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        store.setImage(canvas.toDataURL());
      }
      if (store.selectedLayer) {
        store.computeActivations(img);
      }
    },
    [store],
  );

  const handleWebcamCapture = useCallback(() => {
    const imageData = webcam.capture();
    if (!imageData) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
    store.setImage(canvas.toDataURL());
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (store.selectedLayer) store.computeActivations(img);
    };
    img.src = canvas.toDataURL();
  }, [webcam, store]);

  const handleReset = useCallback(() => {
    store.setImage(null);
    imgRef.current = null;
    if (webcam.isActive) webcam.stop();
  }, [store, webcam]);

  return (
    <ModuleLayout
      title="CNN Visualization"
      description="Visualize convolutional neural network filters and activation maps"
      learnMore="Convolutional Neural Networks learn hierarchical visual features. Early layers detect simple patterns like edges and textures, while deeper layers recognize complex shapes and objects. This tool lets you see what each convolutional filter has learned and how it responds to your input image."
    >
      <div className="space-y-6">
        {/* Controls row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => (webcam.isActive ? webcam.stop() : webcam.start())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-surface-light border border-border hover:border-primary/50 text-text-muted hover:text-text transition-colors"
            >
              {webcam.isActive ? <CameraOff size={14} /> : <Camera size={14} />}
              {webcam.isActive ? 'Stop' : 'Webcam'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-surface-light border border-border hover:border-primary/50 text-text-muted hover:text-text transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          {/* Layer selector */}
          {store.availableLayers.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="cnn-layer-select" className="text-xs text-text-muted">
                Layer:
              </label>
              <select
                id="cnn-layer-select"
                value={store.selectedLayer || ''}
                onChange={(e) => store.setLayer(e.target.value)}
                className="px-2 py-1 text-xs bg-surface-light border border-border rounded-md text-text focus:outline-none focus:border-primary"
              >
                {store.availableLayers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Model loading */}
        {store.modelStatus === 'loading' && (
          <div className="flex items-center justify-center h-32 bg-surface rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Loader size={16} className="animate-spin text-primary" />
              <p className="text-sm text-text-muted">Loading MobileNet V2...</p>
            </div>
          </div>
        )}

        {store.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{store.error}</p>
          </div>
        )}

        {store.modelStatus === 'ready' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
                Input Image
              </h3>
              {webcam.isActive ? (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden bg-surface border border-border">
                    <video ref={webcam.videoRef} className="w-full" autoPlay playsInline muted />
                  </div>
                  <button
                    onClick={handleWebcamCapture}
                    className="w-full py-1.5 rounded-md bg-primary hover:bg-primary-light text-white text-xs font-medium transition-colors"
                  >
                    Capture & Visualize
                  </button>
                </div>
              ) : store.inputImage ? (
                <div className="rounded-lg overflow-hidden bg-surface border border-border">
                  <img
                    src={store.inputImage}
                    alt="Input"
                    className="w-full object-contain max-h-48"
                  />
                </div>
              ) : (
                <ImageDropzone onImageLoad={handleImageLoad} className="h-48" />
              )}

              {/* Layer info */}
              {store.layerInfo && (
                <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
                  <p className="text-xs text-text-muted">
                    <span className="text-text font-medium">{store.layerInfo.name}</span>
                  </p>
                  <p className="text-xs text-text-muted">Type: {store.layerInfo.className}</p>
                  <p className="text-xs text-text-muted">
                    Output: [{store.layerInfo.outputShape.join(', ')}]
                  </p>
                  <p className="text-xs text-text-muted">
                    Filters: {store.layerInfo.outputShape[store.layerInfo.outputShape.length - 1]}
                  </p>
                </div>
              )}
            </div>

            {/* Filter Weights */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
                Filter Weights
                {store.filterWeightImages.length > 0 && (
                  <span className="text-text-muted font-normal ml-1">
                    ({store.filterWeightImages.length})
                  </span>
                )}
              </h3>
              {store.isComputing && store.filterWeightImages.length === 0 ? (
                <div className="flex items-center justify-center h-32 bg-surface rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Loader size={14} className="animate-spin text-primary" />
                    <p className="text-xs text-text-muted">Computing...</p>
                  </div>
                </div>
              ) : store.filterWeightImages.length > 0 ? (
                <div className="flex flex-wrap gap-1 p-3 bg-surface rounded-lg border border-border max-h-96 overflow-y-auto">
                  {store.filterWeightImages.map((img, i) => (
                    <MiniCanvas key={i} imageData={img} size={40} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-surface rounded-lg border border-border">
                  <p className="text-xs text-text-muted">Select a layer to view filters</p>
                </div>
              )}
            </div>

            {/* Activation Maps */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
                Activation Maps
                {store.activationMapImages.length > 0 && (
                  <span className="text-text-muted font-normal ml-1">
                    ({store.activationMapImages.length})
                  </span>
                )}
              </h3>
              {store.isComputing && store.activationMapImages.length === 0 ? (
                <div className="flex items-center justify-center h-32 bg-surface rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Loader size={14} className="animate-spin text-primary" />
                    <p className="text-xs text-text-muted">Computing...</p>
                  </div>
                </div>
              ) : store.activationMapImages.length > 0 ? (
                <div className="flex flex-wrap gap-1 p-3 bg-surface rounded-lg border border-border max-h-96 overflow-y-auto">
                  {store.activationMapImages.map((img, i) => (
                    <MiniCanvas key={i} imageData={img} size={40} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-surface rounded-lg border border-border">
                  <p className="text-xs text-text-muted">
                    Provide an input image to view activations
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
