'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Edit3 } from 'lucide-react';
import { updateModifierOption } from '@/lib/menus-api';
import type { ModifierOption } from '@/lib/types';

interface EditModifierOptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  modifierId: number;
  optionData: ModifierOption;
}

export function EditModifierOptionModal({
  open,
  onClose,
  onSuccess,
  menuId,
  modifierId,
  optionData,
}: EditModifierOptionModalProps) {
  const [formData, setFormData] = useState({
    name: optionData.name,
    priceAdjustment: optionData.priceAdjustment.toString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: optionData.name,
        priceAdjustment: optionData.priceAdjustment.toString(),
      });
      setError('');
    }
  }, [open, optionData]);

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
      const response = await updateModifierOption(
        menuId,
        modifierId,
        optionData.id,
        formData.name.trim(),
        priceAdjustment,
      );

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update modifier option');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update modifier option');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit3 className="h-5 w-5 text-orange-500" />
            Edit Modifier Option
          </DialogTitle>
          <DialogDescription>
            Update option name and price adjustment.
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

          <div className="space-y-2">
            <Label htmlFor="priceAdjustment">Price Adjustment ($) <span className="text-red-500">*</span></Label>
            <Input
              id="priceAdjustment"
              type="number"
              step="0.01"
              min="0"
              value={formData.priceAdjustment}
              onChange={(e) => setFormData({ ...formData, priceAdjustment: e.target.value })}
              disabled={isSubmitting}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-slate-500">Extra cost for this option</p>
          </div>

          {optionData.isDefault && (
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-sm text-amber-700">⭐ This option is set as the default for this modifier group.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
