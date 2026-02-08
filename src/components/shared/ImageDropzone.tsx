import { useCallback, useState, type ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface ImageDropzoneProps {
  onImageLoad: (img: HTMLImageElement) => void;
  children?: ReactNode;
  className?: string;
}

export function ImageDropzone({ onImageLoad, children, className = '' }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => onImageLoad(img);
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-xl transition-colors ${
        isDragging ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'border-border/60 hover:border-primary/50 hover:bg-primary/[0.03]'
      } ${className}`}
    >
      {children || (
        <label className="flex flex-col items-center justify-center p-8 cursor-pointer">
          <Upload size={24} className="text-text-muted mb-2" />
          <p className="text-sm text-text-muted">Drop an image or click to upload</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      )}
    </div>
  );
}
