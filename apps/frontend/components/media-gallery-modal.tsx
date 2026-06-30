'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { listMenuImages, deleteMenuImage } from '@/lib/menus-api';

interface MediaFile {
  name: string;
  url: string;
  size: number;
}

interface MediaGalleryModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  currentImage?: string;
}

export function MediaGalleryModal({ open, onClose, onSelectImage, currentImage }: MediaGalleryModalProps) {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadImages();
    }
  }, [open]);

  const loadImages = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await listMenuImages('menu-items', 100, 0);
      if (response.success && response.data) {
        setImages(response.data.files);
      } else {
        setError(response.message || 'Failed to load images');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  const handleDeleteImage = async (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setDeletingImage(imageUrl);
    try {
      const response = await deleteMenuImage(imageUrl);
      if (response.success) {
        setImages(images.filter(img => img.url !== imageUrl));
        if (selectedImage === imageUrl) {
          setSelectedImage(null);
        }
      } else {
        setError(response.message || 'Failed to delete image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setDeletingImage(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-5 w-5 text-orange-500" />
            Media Gallery
          </DialogTitle>
          <DialogDescription>
            Select an existing image from Supabase or upload a new one to avoid duplicates.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No images found in Supabase storage.</p>
              <p className="text-sm">Upload a new image to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.url}
                  className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedImage === image.url
                      ? 'border-orange-500 ring-2 ring-orange-200'
                      : 'border-slate-200 hover:border-orange-300'
                  } ${currentImage === image.url ? 'bg-orange-50' : ''}`}
                  onClick={() => handleSelectImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  {/* Selected indicator */}
                  {selectedImage === image.url && (
                    <div className="absolute top-2 left-2 bg-orange-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Currently used indicator */}
                  {currentImage === image.url && selectedImage !== image.url && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Current
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteImage(image.url, e)}
                    disabled={deletingImage === image.url}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingImage === image.url ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>

                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{image.name}</p>
                    <p className="text-white/70 text-xs">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-slate-500">
            {images.length} {images.length === 1 ? 'image' : 'images'} in gallery
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={!selectedImage}
              className="bg-gradient-to-r from-red-600 to-orange-500"
            >
              Select Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
