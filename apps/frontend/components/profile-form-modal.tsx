'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Customer, UpdateCustomerRequest } from '../lib/customer-types';
import { updateCustomerProfile } from '../lib/customer-api';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: Customer;
  token: string;
}

export function ProfileFormModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
  token,
}: ProfileFormModalProps) {
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    firstName: customer.firstName,
    lastName: customer.lastName || '',
    email: customer.email || '',
    profileImage: customer.profileImage || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName || '',
        email: customer.email || '',
        profileImage: customer.profileImage || '',
      });
      setErrors({});
    }
  }, [isOpen, customer]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      await updateCustomerProfile(token, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData({ ...formData, profileImage: imageUrl });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-900 flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* First Name */}
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter first name"
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName">Last Name (Optional)</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter last name"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Profile Image URL - Hidden in v1, managed by image component */}
          <input type="hidden" value={formData.profileImage} />

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600"
            >
              {isLoading ? (
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
