'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { uploadMenuImage } from '@/lib/menus-api';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  onRemove?: () => void;
}

export function ImageUploadComponent({ onImageUploaded, currentImage, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const response = await uploadMenuImage(file);
      if (response.success && response.data?.imageUrl) {
        onImageUploaded(response.data.imageUrl);
        setPreview(response.data.imageUrl);
      } else {
        setError(response.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploaded]);

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onRemove?.();
  };

  return (
    <div className="flex items-start gap-4">
      {preview ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-orange-200 bg-white">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-white">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-orange-400" />
              <span className="text-xs text-slate-500 mt-1">Upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
