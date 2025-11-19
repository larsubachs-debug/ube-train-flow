import { useCallback, useState } from 'react';
import { Upload, X, Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface MediaUploadZoneProps {
  bucket: string;
  folder?: string;
  accept?: 'image' | 'video' | 'all';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
  maxSizeMB?: number;
  onUploadComplete?: (mediaId: string, publicUrl: string) => void;
  currentMediaUrl?: string;
  className?: string;
}

export const MediaUploadZone = ({
  bucket,
  folder,
  accept = 'all',
  aspectRatio = '16:9',
  maxSizeMB = 50,
  onUploadComplete,
  currentMediaUrl,
  className,
}: MediaUploadZoneProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentMediaUrl);
  const { uploadMedia, isUploading, progress } = useMediaUpload();

  const acceptTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    video: ['video/mp4', 'video/webm'],
    all: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
  };

  const aspectRatioClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleUpload(files[0]);
      }
    },
    [bucket, folder]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handleUpload(files[0]);
      }
    },
    [bucket, folder]
  );

  const handleUpload = async (file: File) => {
    try {
      setPreviewUrl(URL.createObjectURL(file));
      
      const { mediaId, publicUrl } = await uploadMedia(file, {
        bucket,
        folder,
        maxSizeMB,
        acceptedTypes: acceptTypes[accept],
      });

      setPreviewUrl(publicUrl);
      onUploadComplete?.(mediaId, publicUrl);
    } catch (error) {
      setPreviewUrl(currentMediaUrl);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onUploadComplete?.('', '');
  };

  const isVideo = previewUrl?.includes('.mp4') || previewUrl?.includes('.webm');

  return (
    <div className={cn('relative', aspectRatioClasses[aspectRatio], className)}>
      <div
        className={cn(
          'relative w-full h-full rounded-lg border-2 border-dashed transition-all',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          previewUrl ? 'border-solid' : '',
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                className="w-full h-full object-cover rounded-lg"
                controls
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            )}
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept={acceptTypes[accept].join(',')}
              onChange={handleFileInput}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {accept === 'image' && <Image className="h-8 w-8" />}
              {accept === 'video' && <Video className="h-8 w-8" />}
              {accept === 'all' && <Upload className="h-8 w-8" />}
              <span className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Drop file or click to upload'}
              </span>
              <span className="text-xs">
                {accept === 'image' && 'JPG, PNG, WEBP'}
                {accept === 'video' && 'MP4, WebM'}
                {accept === 'all' && 'Images or Videos'}
                {' • '}Max {maxSizeMB}MB
              </span>
            </div>
          </label>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="w-3/4 space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center">{progress}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
