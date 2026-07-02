'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Beef } from 'lucide-react';
import { createMenuItem } from '@/lib/menus-api';
import { ImageUploadComponent } from '@/components/image-upload-component';

interface CreateMenuItemModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  categoryId: number;
}

export function CreateMenuItemModal({ open, onClose, onSuccess, menuId, categoryId }: CreateMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    isVegetarian: false,
    isSpicy: false,
    preparationTime: '',
    calories: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        basePrice: '',
        isVegetarian: false,
        isSpicy: false,
        preparationTime: '',
        calories: '',
      });
      setImageUrl('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.basePrice) {
      setError('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.basePrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await createMenuItem(menuId, categoryId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        basePrice: price,
        imageUrl: imageUrl || undefined,
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to create menu item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Beef className="h-5 w-5 text-emerald-500" />
            Add Menu Item
          </DialogTitle>
          <DialogDescription>
            Add a new item to this category with image, pricing, and dietary information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Item Name <span className="text-emerald-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                placeholder="e.g., Grilled Chicken Salad"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) <span className="text-emerald-500">*</span></Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                disabled={isSubmitting}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparationTime">Prep Time (mins)</Label>
              <Input
                id="preparationTime"
                type="number"
                min="0"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                disabled={isSubmitting}
                placeholder="15"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                placeholder="Brief description of the item"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                disabled={isSubmitting}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUploadComponent
                onImageUploaded={(url) => setImageUrl(url)}
                currentImage={imageUrl}
                onRemove={() => setImageUrl('')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVegetarian}
                onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                disabled={isSubmitting}
                className="rounded border-gray-300 text-emerald-500 focus:ring-orange-500"
              />
              <span className="text-sm">Vegetarian 🥬</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSpicy}
                onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                disabled={isSubmitting}
                className="rounded border-gray-300 text-emerald-500 focus:ring-orange-500"
              />
              <span className="text-sm">Spicy 🌶️</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-500">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
