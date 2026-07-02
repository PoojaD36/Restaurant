'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { useCustomerAuth } from '../../../contexts/customer-auth-context';
import { ProfileImageUpload } from '../../../components/profile-image-upload';
import { ProfileFormModal } from '../../../components/profile-form-modal';
import { AddressForm } from '../../../components/address-form';
import { CustomerHeader } from '../../../components/customer-header';
import { CustomerBottomNav } from '../../../components/customer-bottom-nav';
import { CustomerAddress } from '../../../lib/customer-types';
import {
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from '../../../lib/customer-api';

export default function CustomerProfilePage() {
  const { customer, isAuthenticated, isLoading: authLoading, refreshProfile } = useCustomerAuth();
  const router = useRouter();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<CustomerAddress | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState<string | undefined>(customer?.profileImage);

  useEffect(() => {
    // Redirect to customer home if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/customer');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (customer) {
      setTempProfileImage(customer.profileImage);
    }
  }, [customer]);

  const handleProfileUpdate = async () => {
    // Refresh profile data after successful update
    await refreshProfile();
  };

  const handleImageChange = (imageUrl: string) => {
    setTempProfileImage(imageUrl);
  };

  const handleAddAddress = () => {
    setEditAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!customer || !customer.addresses) return;

    const address = customer.addresses.find((a) => a.id === addressId);
    if (address?.isDefault) {
      alert('Cannot delete default address');
      return;
    }

    if (confirm('Are you sure you want to delete this address?')) {
      try {
        setIsUpdating(true);
        const token = localStorage.getItem('customerAccessToken');
        if (token) {
          await deleteCustomerAddress(token, addressId);
          await refreshProfile();
        }
      } catch (error: any) {
        alert(error.message || 'Failed to delete address');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('customerAccessToken');
      if (token) {
        await setDefaultCustomerAddress(token, addressId);
        await refreshProfile();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to set default address');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddressSuccess = async () => {
    await refreshProfile();
    setIsAddressModalOpen(false);
    setEditAddress(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!customer || !isAuthenticated) {
    return null; // Will redirect
  }

  const displayName = `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 pb-16 lg:pb-0">
      {/* Header */}
      <CustomerHeader title="My Profile" showBackButton onBackClick={() => router.push('/customer')} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <ProfileImageUpload
                    currentImage={tempProfileImage}
                    onImageChange={handleImageChange}
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-emerald-900">{displayName}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {customer.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Shield className="h-3 w-3" />
                            Verified Customer
                          </span>
                        ) : (
                          <Badge variant="secondary">{customer.status}</Badge>
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsProfileModalOpen(true)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span className="text-gray-700">{customer.phone}</span>
                      <Badge variant="outline" className="text-xs">
                        Primary
                      </Badge>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        <span className="text-gray-700">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-0"
                onClick={() => router.push('/customer/orders')}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-full">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-emerald-900">My Orders</p>
                    <p className="text-sm text-gray-500">View order history</p>
                  </div>
                </div>
              </Button>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-full">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-emerald-900">Saved Addresses</p>
                  <p className="text-sm text-gray-500">
                    {customer.addresses?.length || 0} address{customer.addresses?.length !== 1 ? 'es' : ''} saved
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Saved Addresses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Saved Addresses
                </h3>
                <Button
                  onClick={handleAddAddress}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                  disabled={isUpdating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>

              {!customer.addresses || customer.addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No addresses saved yet</p>
                  <Button
                    onClick={handleAddAddress}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {customer.addresses.map((address, index) => (
                      <motion.div
                        key={address.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`p-4 border-2 transition-all ${
                            address.isDefault
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Address Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-emerald-900">{address.label}</h4>
                                {address.isDefault && (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900">{address.name}</p>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-700 mt-1">
                                {address.addressLine1}
                                {address.addressLine2 && `, ${address.addressLine2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 hover:bg-emerald-100"
                                  onClick={() => handleEditAddress(address)}
                                  disabled={isUpdating}
                                >
                                  <Edit className="h-4 w-4 text-emerald-600" />
                                </Button>
                                {!address.isDefault && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-red-100"
                                    onClick={() => handleDeleteAddress(address.id)}
                                    disabled={isUpdating}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
                              {!address.isDefault && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  disabled={isUpdating}
                                >
                                  Set Default
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/customer/orders')}
            >
              <Package className="h-4 w-4 mr-2" />
              View Order History
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <ProfileFormModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={handleProfileUpdate}
        customer={customer}
        token={localStorage.getItem('customerAccessToken') || ''}
      />

      <AddressForm
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={handleAddressSuccess}
        editAddress={editAddress}
        token={localStorage.getItem('customerAccessToken') || ''}
      />

      {/* Bottom Navigation (Mobile Only) */}
      <CustomerBottomNav />
    </div>
  );
}
