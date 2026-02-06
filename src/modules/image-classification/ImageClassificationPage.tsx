import { useEffect, useCallback, useRef } from 'react';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { ImageDropzone } from '../../components/shared/ImageDropzone';
import { useImageClassifierStore } from '../../stores/useImageClassifierStore';
import { useWebcam } from '../../hooks/useWebcam';

function PredictionBar({
  className,
  probability,
  rank,
}: {
  className: string;
  probability: number;
  rank: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text truncate">{className}</span>
        <span className="text-text-muted font-mono">{(probability * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-surface-lighter rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${probability * 100}%`,
            backgroundColor: rank === 0 ? '#10b981' : '#3b82f6',
          }}
        />
      </div>
    </div>
  );
}

export default function ImageClassificationPage() {
  const {
    modelStatus,
    loadProgress,
    predictions,
    inputImage,
    isClassifying,
    error,
    loadModel,
    classify,
    setImage,
    reset,
  } = useImageClassifierStore();

  const webcam = useWebcam();
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const handleImageLoad = useCallback(
    (img: HTMLImageElement) => {
      imgRef.current = img;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setImage(canvas.toDataURL());
      }
    },
    [setImage],
  );

  const handleClassify = useCallback(async () => {
    if (imgRef.current) {
      await classify(imgRef.current);
    }
  }, [classify]);

  const handleWebcamCapture = useCallback(async () => {
    const imageData = webcam.capture();
    if (!imageData) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL();
    setImage(dataUrl);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      classify(img);
    };
    img.src = dataUrl;
  }, [webcam, setImage, classify]);

  const handleReset = useCallback(() => {
    reset();
    imgRef.current = null;
    if (webcam.isActive) webcam.stop();
  }, [reset, webcam]);

  return (
    <ModuleLayout
      title="Image Classification"
      description="Classify images using MobileNet V2 pre-trained on ImageNet"
      learnMore="MobileNet is a lightweight convolutional neural network designed for mobile and edge devices. It uses depthwise separable convolutions to reduce computation while maintaining accuracy. This model was trained on ImageNet with 1000 categories."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left: Image Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Input</h2>
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
          </div>

          {webcam.isActive ? (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-surface border border-border">
                <video ref={webcam.videoRef} className="w-full" autoPlay playsInline muted />
              </div>
              <button
                onClick={handleWebcamCapture}
                disabled={modelStatus !== 'ready'}
                className="w-full py-2 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Capture & Classify
              </button>
              {webcam.error && <p className="text-xs text-red-400">{webcam.error}</p>}
            </div>
          ) : inputImage ? (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-surface border border-border">
                <img src={inputImage} alt="Input" className="w-full object-contain max-h-80" />
              </div>
              <button
                onClick={handleClassify}
                disabled={modelStatus !== 'ready' || isClassifying}
                className="w-full py-2 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isClassifying ? 'Classifying...' : 'Classify Image'}
              </button>
            </div>
          ) : (
            <ImageDropzone onImageLoad={handleImageLoad} className="h-64" />
          )}
        </div>

        {/* Right: Predictions */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Predictions</h2>

          {modelStatus === 'loading' && (
            <div className="space-y-3 p-4 bg-surface rounded-lg border border-border">
              <p className="text-sm text-text-muted">Loading MobileNet V2...</p>
              <div className="h-2 bg-surface-lighter rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {modelStatus === 'error' && error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {modelStatus === 'ready' && predictions.length === 0 && !isClassifying && (
            <div className="flex items-center justify-center h-48 bg-surface rounded-lg border border-border">
              <p className="text-sm text-text-muted">Upload or capture an image to classify</p>
            </div>
          )}

          {isClassifying && (
            <div className="flex items-center justify-center h-48 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm text-text-muted">Classifying...</p>
              </div>
            </div>
          )}

          {predictions.length > 0 && (
            <div className="space-y-3 p-4 bg-surface rounded-lg border border-border">
              {predictions.map((pred, i) => (
                <PredictionBar
                  key={pred.className}
                  className={pred.className}
                  probability={pred.probability}
                  rank={i}
                />
              ))}
            </div>
          )}

          {modelStatus === 'ready' && (
            <div className="p-3 bg-surface-light rounded-md border border-border">
              <p className="text-xs text-text-muted">
                Model: MobileNet V2 (alpha=1.0) -- 1000 ImageNet categories -- ~14MB
              </p>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
