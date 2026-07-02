'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
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
import { CustomerAddress, AddAddressRequest } from '../lib/customer-types';
import { addCustomerAddress, updateCustomerAddress } from '../lib/customer-api';

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAddress?: CustomerAddress | null;
  token: string;
}

export function AddressForm({ isOpen, onClose, onSuccess, editAddress, token }: AddressFormProps) {
  const [formData, setFormData] = useState<AddAddressRequest>({
    label: 'Home',
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when opening/closing or changing edit mode
  useEffect(() => {
    if (isOpen) {
      if (editAddress) {
        setFormData({
          label: editAddress.label,
          name: editAddress.name,
          phone: editAddress.phone,
          addressLine1: editAddress.addressLine1,
          addressLine2: editAddress.addressLine2 || '',
          city: editAddress.city,
          state: editAddress.state,
          country: editAddress.country,
          postalCode: editAddress.postalCode,
          isDefault: editAddress.isDefault,
        });
      } else {
        setFormData({
          label: 'Home',
          name: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          country: 'India',
          postalCode: '',
          isDefault: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, editAddress]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) newErrors.label = 'Label is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      if (editAddress) {
        await updateCustomerAddress(token, editAddress.id, formData);
      } else {
        await addCustomerAddress(token, formData);
      }
      onSuccess();
      onClose();
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save address' });
    } finally {
      setIsLoading(false);
    }
  };

  const labelOptions = ['Home', 'Work', 'Other'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-emerald-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            {editAddress ? 'Edit Address' : 'Add New Address'}
          </DialogTitle>
          <DialogDescription>
            {editAddress ? 'Update your delivery address' : 'Enter your delivery address details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Label Selection */}
          <div>
            <Label>Address Label *</Label>
            <div className="flex gap-2 mt-2">
              {labelOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, label: option })}
                  className={`px-4 py-2 rounded-full border-2 transition-colors ${
                    formData.label === option
                      ? 'border-emerald-500 bg-orange-50 text-emerald-900'
                      : 'border-gray-200 text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.label && <p className="text-red-600 text-sm mt-1">{errors.label}</p>}
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Address Line 1 */}
          <div>
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="House/Flat number, Building name"
              className={errors.addressLine1 ? 'border-red-500' : ''}
            />
            {errors.addressLine1 && <p className="text-red-600 text-sm mt-1">{errors.addressLine1}</p>}
          </div>

          {/* Address Line 2 */}
          <div>
            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Street, Area (optional)"
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Enter state"
              className={errors.state ? 'border-red-500' : ''}
            />
            {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Enter country"
              className={errors.country ? 'border-red-500' : ''}
            />
            {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
          </div>

          {/* Postal Code */}
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Enter postal code"
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
          </div>

          {/* Set as Default */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-emerald-600"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default address
            </Label>
          </div>

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
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editAddress ? 'Update Address' : 'Save Address'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
