'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({
  currentImage,
  onImageChange,
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create a local preview URL
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // In v1, we'll use the local URL directly
      // Future: Upload to Supabase and get public URL
      onImageChange(localPreview);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
      setPreviewUrl(currentImage);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`relative ${!disabled ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        {/* Image Container */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-orange-100 to-amber-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-16 w-16 text-orange-300" />
            </div>
          )}

          {/* Overlay with camera icon */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Edit Badge */}
        {!disabled && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="absolute bottom-2 right-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white p-2 rounded-full shadow-lg"
          >
            <Camera className="h-4 w-4" />
          </motion.div>
        )}
      </motion.div>

      {/* Helper Text */}
      {!disabled && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click to change photo
        </p>
      )}
    </div>
  );
}
