'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Layers } from 'lucide-react';
import { updateModifierGroup } from '@/lib/menus-api';
import type { ModifierGroup } from '@/lib/types';

interface EditModifierGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  groupData: ModifierGroup;
}

export function EditModifierGroupModal({
  open,
  onClose,
  onSuccess,
  menuId,
  groupData,
}: EditModifierGroupModalProps) {
  const [formData, setFormData] = useState({
    name: groupData.name,
    minSelect: groupData.minSelect.toString(),
    maxSelect: groupData.maxSelect.toString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: groupData.name,
        minSelect: groupData.minSelect.toString(),
        maxSelect: groupData.maxSelect.toString(),
      });
      setError('');
    }
  }, [open, groupData]);

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
      const response = await updateModifierGroup(
        menuId,
        groupData.id,
        formData.name.trim(),
        minSelect,
        maxSelect,
      );

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update modifier group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update modifier group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5 text-orange-500" />
            Edit Modifier Group
          </DialogTitle>
          <DialogDescription>
            Update modifier group name and selection limits.
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

          <div className="p-3 bg-slate-50 rounded-md border">
            <div className="text-sm text-slate-600">
              <p><strong>Type:</strong> {groupData.type === 'SINGLE' ? 'Single (select one)' : 'Multiple (select many)'}</p>
              <p><strong>Required:</strong> {groupData.required ? 'Yes' : 'No'}</p>
              <p className="text-xs text-slate-500 mt-1">Selection type and required status cannot be edited after creation.</p>
            </div>
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
