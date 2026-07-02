'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, X, Loader2, Images } from 'lucide-react';
import { uploadMenuImage } from '@/lib/menus-api';
import { MediaGalleryModal } from '@/components/media-gallery-modal';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  onRemove?: () => void;
}

export function ImageUploadComponent({ onImageUploaded, currentImage, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState('');
  const [showMediaGallery, setShowMediaGallery] = useState(false);

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

  const handleSelectFromGallery = (imageUrl: string) => {
    onImageUploaded(imageUrl);
    setPreview(imageUrl);
    setShowMediaGallery(false);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Image preview or upload area */}
        <div className="flex items-start gap-4">
          {preview ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-emerald-200 bg-white">
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
            <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors bg-white">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-emerald-400" />
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

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowMediaGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors text-sm"
              disabled={isUploading}
            >
              <Images className="h-4 w-4 text-emerald-500" />
              Browse Media
            </button>
            {!preview && (
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors text-sm cursor-pointer">
                <UploadCloud className="h-4 w-4 text-emerald-500" />
                Upload New
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        open={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        onSelectImage={handleSelectFromGallery}
        currentImage={preview || undefined}
      />
    </>
  );
}
