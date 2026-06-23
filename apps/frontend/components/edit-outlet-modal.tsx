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
import { Loader2, MapPin, Info } from 'lucide-react';
import { updateOutlet, getOutletById } from '../lib/outlets-api';
import type { Outlet, UpdateOutletRequest } from '../lib/types';

interface EditOutletModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  outletId: string | null;
}

export function EditOutletModal({
  open,
  onClose,
  onSuccess,
  outletId,
}: EditOutletModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    openingTime: '',
    closingTime: '',
  });
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [isLoadingOutlet, setIsLoadingOutlet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (open && outletId) {
      loadOutlet();
    } else if (!open) {
      // Reset form when modal closes
      setFormData({
        name: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        openingTime: '',
        closingTime: '',
      });
      setOutlet(null);
      setError('');
      setInfoMessage('');
    }
  }, [open, outletId]);

  const loadOutlet = async () => {
    if (!outletId) return;

    setIsLoadingOutlet(true);
    setError('');
    try {
      const response = await getOutletById(outletId);
      const outletData: Outlet | undefined = response.data;

      if (!outletData) {
        setError('Failed to load outlet: No data received');
        setOutlet(null);
        setIsLoadingOutlet(false);
        return;
      }

      setOutlet(outletData);
      setFormData({
        name: outletData.name || '',
        phone: outletData.phone || '',
        email: outletData.email || '',
        addressLine1: outletData.addressLine1 || '',
        addressLine2: outletData.addressLine2 || '',
        city: outletData.city || '',
        state: outletData.state || '',
        country: outletData.country || '',
        postalCode: outletData.postalCode || '',
        latitude: outletData.latitude || '',
        longitude: outletData.longitude || '',
        openingTime: outletData.openingTime || '',
        closingTime: outletData.closingTime || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlet');
    } finally {
      setIsLoadingOutlet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletId) return;

    // Validate required fields
    if (!formData.name || !formData.addressLine1 ||
        !formData.city || !formData.state || !formData.country || !formData.postalCode) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setInfoMessage('');

    try {
      const data: UpdateOutletRequest = {
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        addressLine1: formData.addressLine1 || undefined,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        postalCode: formData.postalCode || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        openingTime: formData.openingTime || undefined,
        closingTime: formData.closingTime || undefined,
      };

      await updateOutlet(outletId, data);
      setInfoMessage('Outlet updated successfully!');

      // Close modal and refresh list after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update outlet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if address fields will trigger geocoding
  const willGeocode = outlet && (
    formData.addressLine1 !== outlet.addressLine1 ||
    formData.addressLine2 !== (outlet.addressLine2 || '') ||
    formData.city !== outlet.city ||
    formData.state !== outlet.state ||
    formData.country !== outlet.country ||
    formData.postalCode !== outlet.postalCode
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Edit Outlet
          </DialogTitle>
          <DialogDescription>
            Update outlet details. Address changes will auto-geocode latitude/longitude.
          </DialogDescription>
        </DialogHeader>

        {isLoadingOutlet ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {infoMessage && (
              <div className="rounded-md bg-green-50 p-3 border border-green-200">
                <p className="text-sm text-green-600">{infoMessage}</p>
              </div>
            )}

            {willGeocode && (
              <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-600">
                    Address changes detected. Latitude/longitude will be automatically updated via geocoding.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Outlet Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Branch"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="outlet@example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">
                Address Line 1 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="Street address"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Apartment, suite, etc."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Postal Code"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="40.7128"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500">Auto-filled from address (leave empty to geocode)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="-74.0060"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500">Auto-filled from address (leave empty to geocode)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Outlet'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
