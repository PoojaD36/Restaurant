'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { updateRestaurant, uploadRestaurantLogo } from '../lib/restaurants-api';
import type { RestaurantDetail } from '../lib/types';

interface EditRestaurantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurant: RestaurantDetail | null;
}

export function EditRestaurantModal({
  open,
  onClose,
  onSuccess,
  restaurant,
}: EditRestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (open && restaurant) {
      setFormData({
        name: restaurant.name,
        slug: restaurant.slug,
        logo: restaurant.logo || '',
        description: restaurant.description || '',
      });
      setPreviewUrl(restaurant.logo || '');
      setError('');
    }
  }, [open, restaurant]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    const newSlug = generateSlug(value);
    setFormData({ ...formData, name: value, slug: newSlug });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const response = await uploadRestaurantLogo(file);
      if (response.success && response.data?.url) {
        setFormData({ ...formData, logo: response.data.url });
        setPreviewUrl(response.data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: '' });
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setError('Please fill in all required fields');
      return;
    }

    if (!restaurant) return;

    setIsSubmitting(true);
    setError('');
    try {
      await updateRestaurant(restaurant.id, {
        name: formData.name,
        slug: formData.slug,
        logo: formData.logo || undefined,
        description: formData.description || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Edit Restaurant
          </DialogTitle>
          <DialogDescription>
            Update restaurant information and logo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Restaurant Name <span className="text-emerald-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter restaurant name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-emerald-500">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="restaurant-slug"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-slate-500">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the restaurant"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Restaurant Logo</Label>
            {previewUrl ? (
              <div className="relative w-full h-32 border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Restaurant logo preview"
                  className="w-full h-full object-contain"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  disabled={isUploading || isSubmitting}
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Click to upload logo</span>
                      <span className="text-xs text-gray-400">JPEG, PNG, WebP (max 5MB)</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
