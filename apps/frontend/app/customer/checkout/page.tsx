'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../../contexts/cart-context';
import { useCustomerAuth } from '../../../contexts/customer-auth-context';
import { createOrder } from '../../../lib/order-api';
import { getCustomerProfile, deleteCustomerAddress } from '../../../lib/customer-api';
import { CustomerAddress } from '../../../lib/customer-types';
import { AddressSelector } from '../../../components/address-selector';
import { AddressForm } from '../../../components/address-form';
import { OrderSummary } from '../../../components/order-summary';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { CustomerAuthSheet } from '../../../components/customer-auth-sheet';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { customer, isAuthenticated, getCustomerToken } = useCustomerAuth();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(true);
  const [editAddress, setEditAddress] = useState<CustomerAddress | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      router.push('/customer');
    }
  }, [cart, router]);

  // Load customer addresses
  const loadAddresses = useCallback(async () => {
    if (!isAuthenticated || !customer) return;

    setIsLoadingAddresses(true);
    try {
      const token = getCustomerToken();
      if (!token) return;

      const response = await getCustomerProfile(token);
      if (response.success && response.customer.addresses) {
        setAddresses(response.customer.addresses);
        // Set default address as selected
        const defaultAddress = response.customer.addresses.find((a: CustomerAddress) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (response.customer.addresses.length > 0) {
          setSelectedAddressId(response.customer.addresses[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated, customer, getCustomerToken]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSelectAddress = (addressId: number) => {
    setSelectedAddressId(addressId);
  };

  const handleAddAddress = () => {
    setEditAddress(null);
    setIsAddressFormOpen(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditAddress(address);
    setIsAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      const token = getCustomerToken();
      if (!token) return;

      await deleteCustomerAddress(token, addressId);
      await loadAddresses();

      // If deleted address was selected, select another
      if (selectedAddressId === addressId) {
        const remaining = addresses.filter((a) => a.id !== addressId);
        if (remaining.length > 0) {
          const defaultAddr = remaining.find((a) => a.isDefault);
          setSelectedAddressId(defaultAddr?.id || remaining[0].id);
        } else {
          setSelectedAddressId(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleAddressFormSuccess = async () => {
    await loadAddresses();
    setIsAddressFormOpen(false);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !cart || !selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    const token = getCustomerToken();
    if (!token) {
      setError('Please log in to place an order');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      // Prepare order items from cart
      const orderItems = cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers.map((mod) => ({
          modifierGroupId: mod.modifierGroupId,
          modifierGroupName: mod.modifierGroupName,
          type: mod.type,
          selectedOptions: mod.selectedOptions.map((opt) => ({
            id: opt.id,
            name: opt.name,
            priceAdjustment: opt.priceAdjustment,
          })),
        })),
      }));

      const orderData = {
        outletId: cart.outletId,
        addressId: selectedAddressId,
        items: orderItems,
      };

      const response = await createOrder(token, orderData);

      if (response.success) {
        setOrderId(response.data.orderId);
        setOrderSuccess(true);
        clearCart();

        // Redirect to order confirmation after 2 seconds
        setTimeout(() => {
          router.push(`/customer/orders/${response.data.orderId}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const canPlaceOrder = isAuthenticated && selectedAddressId !== null && cart !== null;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Show auth sheet if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 border-b border-orange-200/40 bg-white/60 backdrop-blur-xl shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-orange-100"
              >
                <ArrowLeft className="h-5 w-5 text-orange-600" />
              </Button>

              <div className="flex-1">
                <h1 className="text-lg font-bold text-orange-900">Checkout</h1>
                <p className="text-sm text-gray-600">Complete your order</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-orange-600 mb-4" />
            <h2 className="text-xl font-bold text-orange-900 mb-2">Sign In to Continue</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to your account to place your order
            </p>
            <CustomerAuthSheet
              isOpen={isAuthSheetOpen}
              onClose={() => setIsAuthSheetOpen(false)}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-orange-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Your order ID is <span className="font-semibold">#{orderId}</span>
          </p>
          <p className="text-gray-500">Redirecting to order details...</p>
          <Loader2 className="h-6 w-6 text-orange-600 animate-spin mx-auto mt-4" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b border-orange-200/40 bg-white/60 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-orange-100"
            >
              <ArrowLeft className="h-5 w-5 text-orange-600" />
            </Button>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-orange-900">Checkout</h1>
              <p className="text-sm text-gray-600">Complete your order</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Address Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Address Selection */}
            {isLoadingAddresses ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
              </Card>
            ) : (
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={handleSelectAddress}
                onAddAddress={handleAddAddress}
                onEditAddress={handleEditAddress}
                onDeleteAddress={handleDeleteAddress}
              />
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {cart && (
                <OrderSummary
                  cart={cart}
                  isPlacingOrder={isPlacingOrder}
                  canPlaceOrder={canPlaceOrder}
                  onPlaceOrder={handlePlaceOrder}
                  selectedAddressLabel={selectedAddress?.label}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Address Form Modal */}
      <AnimatePresence>
        {isAddressFormOpen && (
          <AddressForm
            isOpen={isAddressFormOpen}
            onClose={() => setIsAddressFormOpen(false)}
            onSuccess={handleAddressFormSuccess}
            editAddress={editAddress}
            token={getCustomerToken() || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
