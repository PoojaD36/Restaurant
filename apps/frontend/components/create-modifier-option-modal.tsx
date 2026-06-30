'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import { createModifierOption } from '@/lib/menus-api';
import type { CreateModifierOptionRequest } from '@/lib/types';

interface CreateModifierOptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  modifierId: number;
}

export function CreateModifierOptionModal({
  open,
  onClose,
  onSuccess,
  menuId,
  modifierId,
}: CreateModifierOptionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    priceAdjustment: '0',
    isDefault: false,
    displayOrder: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        priceAdjustment: '0',
        isDefault: false,
        displayOrder: '0',
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Option name is required');
      return;
    }

    const priceAdjustment = parseFloat(formData.priceAdjustment);
    if (isNaN(priceAdjustment) || priceAdjustment < 0) {
      setError('Please enter a valid price adjustment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data: CreateModifierOptionRequest = {
        name: formData.name.trim(),
        priceAdjustment,
        isDefault: formData.isDefault,
        displayOrder: parseInt(formData.displayOrder) || 0,
      };

      const response = await createModifierOption(menuId, modifierId, data);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to create modifier option');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create modifier option');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PlusCircle className="h-5 w-5 text-orange-500" />
            Add Modifier Option
          </DialogTitle>
          <DialogDescription>
            Add an option to this modifier group (e.g., Small, Large).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Option Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g., Small, Medium, Large"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceAdjustment">Price Adjustment ($)</Label>
              <Input
                id="priceAdjustment"
                type="number"
                step="0.01"
                min="0"
                value={formData.priceAdjustment}
                onChange={(e) => setFormData({ ...formData, priceAdjustment: e.target.value })}
                disabled={isSubmitting}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">Extra cost for this option</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              disabled={isSubmitting}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">Set as default option</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-red-600 to-orange-500">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Option'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
