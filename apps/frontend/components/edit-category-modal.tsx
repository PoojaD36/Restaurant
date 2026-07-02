'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, List } from 'lucide-react';
import { updateCategory } from '@/lib/menus-api';

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  categoryId: number;
  initialName: string;
  initialDisplayOrder: number;
}

export function EditCategoryModal({
  open,
  onClose,
  onSuccess,
  menuId,
  categoryId,
  initialName,
  initialDisplayOrder,
}: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: initialName,
    displayOrder: initialDisplayOrder.toString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: initialName,
        displayOrder: initialDisplayOrder.toString(),
      });
      setError('');
    }
  }, [open, initialName, initialDisplayOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await updateCategory(
        menuId,
        categoryId,
        formData.name.trim(),
        parseInt(formData.displayOrder) || 0,
      );

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <List className="h-5 w-5 text-emerald-500" />
            Edit Category
          </DialogTitle>
          <DialogDescription>
            Update category name and display order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Category Name <span className="text-emerald-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g., Appetizers, Main Course"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
              disabled={isSubmitting}
              min="0"
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
