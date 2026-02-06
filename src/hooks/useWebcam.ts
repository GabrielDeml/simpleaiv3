import { useRef, useState, useCallback, useEffect } from 'react';

interface WebcamResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  capture: () => ImageData | null;
}

export function useWebcam(): WebcamResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 224, height: 224 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      setError(null);
    } catch {
      setError('Could not access webcam. Please allow camera permissions.');
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const capture = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || !isActive) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 224;
    canvas.height = video.videoHeight || 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [isActive]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { videoRef, isActive, error, start, stop, capture };
}
