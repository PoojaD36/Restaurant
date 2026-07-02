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
import { Loader2 } from 'lucide-react';
import { createRestaurant } from '../lib/restaurants-api';
import { getAllUsers } from '../lib/users-api';
import type { CreateRestaurantRequest, UserListItem } from '../lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface CreateRestaurantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRestaurantModal({
  open,
  onClose,
  onSuccess,
}: CreateRestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    adminId: '',
  });
  const [admins, setAdmins] = useState<UserListItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadAdmins();
      setFormData({ name: '', slug: '', logo: '', description: '', adminId: '' });
      setError('');
    }
  }, [open]);

  const loadAdmins = async () => {
    setIsLoadingAdmins(true);
    setError('');
    try {
      const response = await getAllUsers(1, 100);
      const restaurantAdmins = response.data.filter(
        (u) => u.role === 'RESTAURANT_ADMIN',
      );
      setAdmins(restaurantAdmins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.adminId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const data: CreateRestaurantRequest = {
        name: formData.name,
        slug: formData.slug,
        logo: formData.logo || undefined,
        description: formData.description || undefined,
        adminId: parseInt(formData.adminId),
      };
      await createRestaurant(data);
      onSuccess();
      onClose();
      setFormData({ name: '', slug: '', logo: '', description: '', adminId: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Create New Restaurant
          </DialogTitle>
          <DialogDescription>
            Add a new restaurant and assign a restaurant admin.
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
            <Label htmlFor="adminId">
              Restaurant Admin <span className="text-emerald-500">*</span>
            </Label>
            {isLoadingAdmins ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading admins...
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-slate-500">
                No restaurant admins available. Please create one first.
              </p>
            ) : (
              <Select
                value={formData.adminId}
                onValueChange={(value) => setFormData({ ...formData, adminId: value })}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName || ''} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              disabled={isSubmitting}
            />
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
              disabled={isSubmitting || admins.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Restaurant'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
