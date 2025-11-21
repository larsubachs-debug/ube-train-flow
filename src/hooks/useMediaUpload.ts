import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onProgress?: (progress: number) => void;
}

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
}

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  };

  const compressImage = async (file: File, maxWidth = 1920): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.85
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadMedia = async (
    file: File,
    options: UploadOptions
  ): Promise<{ mediaId: string; publicUrl: string }> => {
    const {
      bucket,
      folder = '',
      maxSizeMB = 50,
      acceptedTypes = ['image/*', 'video/*'],
      onProgress,
    } = options;

    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      // Validate file type
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        throw new Error('File type not accepted');
      }

      // Compress images
      let uploadFile: File | Blob = file;
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImage(file);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filepath = folder ? `${folder}/${filename}` : filename;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filepath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(50);
      if (onProgress) onProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filepath);

      // Get metadata
      const metadata: MediaMetadata = {};
      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      } else if (file.type.startsWith('video/')) {
        metadata.duration = await getVideoDuration(file);
      }

      setProgress(75);
      if (onProgress) onProgress(75);

      // Ensure we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      
      // Save to media table with the authenticated user's ID

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .insert({
          user_id: session.user.id,
          bucket_name: bucket,
          file_path: filepath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          width: metadata.width,
          height: metadata.height,
          duration: metadata.duration,
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      setProgress(100);
      if (onProgress) onProgress(100);

      toast({
        title: 'Upload successful',
        description: 'Your media has been uploaded',
      });

      return {
        mediaId: mediaData.id,
        publicUrl: urlData.publicUrl,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadMedia,
    isUploading,
    progress,
  };
};
