'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Layers } from 'lucide-react';
import { createModifierGroup } from '@/lib/menus-api';
import type { CreateModifierGroupRequest } from '@/lib/types';

interface CreateModifierGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  itemId: number;
}

export function CreateModifierGroupModal({
  open,
  onClose,
  onSuccess,
  menuId,
  itemId,
}: CreateModifierGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'SINGLE' as 'SINGLE' | 'MULTIPLE',
    required: false,
    minSelect: '1',
    maxSelect: '1',
    displayOrder: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        type: 'SINGLE',
        required: false,
        minSelect: '1',
        maxSelect: '1',
        displayOrder: '0',
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Modifier group name is required');
      return;
    }

    const minSelect = parseInt(formData.minSelect) || 0;
    const maxSelect = parseInt(formData.maxSelect) || 1;

    if (minSelect < 0 || maxSelect < minSelect) {
      setError('Invalid selection range. Max must be greater than or equal to Min.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data: CreateModifierGroupRequest = {
        name: formData.name.trim(),
        type: formData.type,
        required: formData.required,
        minSelect,
        maxSelect,
        displayOrder: parseInt(formData.displayOrder) || 0,
      };

      const response = await createModifierGroup(menuId, itemId, data);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to create modifier group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create modifier group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5 text-orange-500" />
            Add Modifier Group
          </DialogTitle>
          <DialogDescription>
            Create a modifier group for this item (e.g., Size, Add-ons).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Group Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g., Size, Toppings"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Selection Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SINGLE' | 'MULTIPLE' })}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="SINGLE">Single (select one)</option>
              <option value="MULTIPLE">Multiple (select many)</option>
            </select>
            <p className="text-xs text-slate-500">
              {formData.type === 'SINGLE' ? 'Customer can select one option (e.g., Small, Medium, Large)' : 'Customer can select multiple options (e.g., Extra cheese, Bacon)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              disabled={isSubmitting}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <Label htmlFor="required" className="cursor-pointer">Required selection</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minSelect">Min Selection</Label>
              <Input
                id="minSelect"
                type="number"
                min="0"
                value={formData.minSelect}
                onChange={(e) => setFormData({ ...formData, minSelect: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSelect">Max Selection</Label>
              <Input
                id="maxSelect"
                type="number"
                min="1"
                value={formData.maxSelect}
                onChange={(e) => setFormData({ ...formData, maxSelect: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
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
            <p className="text-xs text-slate-500">Lower numbers appear first</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
