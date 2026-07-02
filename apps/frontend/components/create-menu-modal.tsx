'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { createMenu } from '@/lib/menus-api';
import { getAllRestaurants } from '@/lib/restaurants-api';
import type { Restaurant } from '@/lib/types';

interface CreateMenuModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMenuModal({ open, onClose, onSuccess }: CreateMenuModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restaurantId: '',
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Reset form
      setFormData({ name: '', description: '', restaurantId: '' });
      setError('');

      // Load restaurants
      loadRestaurants();
    }
  }, [open]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAllRestaurants();
      if (response.success && response.data) {
        setRestaurants(response.data);
      } else {
        setError('Failed to load restaurants');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.restaurantId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await createMenu({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        restaurantId: parseInt(formData.restaurantId),
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to create menu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
            Create Menu
          </DialogTitle>
          <DialogDescription>
            Create a new menu for your restaurant. Menus can be shared across all outlets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="restaurant">Restaurant <span className="text-emerald-500">*</span></Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              </div>
            ) : (
              <select
                id="restaurant"
                value={formData.restaurantId}
                onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Menu Name <span className="text-emerald-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g., Lunch Menu, Dinner Menu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              placeholder="Optional description for the menu"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-500">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Menu'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
