'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { updateMenu } from '@/lib/menus-api';
import type { UpdateMenuRequest } from '@/lib/types';

interface EditMenuModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  initialName: string;
  initialDescription?: string;
  initialStatus: 'ACTIVE' | 'INACTIVE';
}

export function EditMenuModal({
  open,
  onClose,
  onSuccess,
  menuId,
  initialName,
  initialDescription,
  initialStatus,
}: EditMenuModalProps) {
  const [formData, setFormData] = useState({
    name: initialName,
    description: initialDescription || '',
    status: initialStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: initialName,
        description: initialDescription || '',
        status: initialStatus,
      });
      setError('');
    }
  }, [open, initialName, initialDescription, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Menu name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updateData: UpdateMenuRequest = {
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      const response = await updateMenu(menuId, updateData);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update menu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UtensilsCrossed className="h-5 w-5 text-orange-500" />
            Edit Menu
          </DialogTitle>
          <DialogDescription>
            Update menu details and status. Changes will be reflected across all outlets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Menu Name <span className="text-red-500">*</span></Label>
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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Inactive menus won't be visible to customers
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-red-600 to-orange-500">
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
