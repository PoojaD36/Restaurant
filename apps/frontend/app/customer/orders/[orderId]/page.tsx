'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  Utensils,
  Receipt,
  Calendar,
  CreditCard,
  Banknote,
  User,
  Truck,
} from 'lucide-react';
import { useCustomerAuth } from '../../../../contexts/customer-auth-context';
import { getOrderById, cancelOrder } from '../../../../lib/order-api';
import { Order, OrderStatus } from '../../../../lib/order-types';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> },
  PREPARING: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: <Utensils className="h-4 w-4" /> },
  READY: { label: 'Ready for Pickup', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800', icon: <Loader2 className="h-4 w-4" /> },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { getCustomerToken } = useCustomerAuth();
  const orderId = parseInt(params.orderId as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const token = getCustomerToken();
        if (!token) {
          router.push('/customer');
          return;
        }

        const response = await getOrderById(token, orderId);
        if (response.success) {
          setOrder(response.data);
        } else {
          setError(response.message || 'Failed to load order');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, getCustomerToken, router]);

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setIsCancelling(true);
    try {
      const token = getCustomerToken();
      if (!token) return;

      const response = await cancelOrder(token, orderId);
      if (response.success) {
        setOrder({ ...order, status: response.data.status });
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/customer')} className="bg-orange-600 hover:bg-orange-700">
            Back to Browse
          </Button>
        </Card>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const canCancel = order.status === OrderStatus.PENDING;

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
              <h1 className="text-lg font-bold text-orange-900">Order Details</h1>
              <p className="text-sm text-gray-600">Order #{order.id}</p>
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${status.color}`}>
              {status.icon}
              {status.label}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outlet Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-red-600 to-orange-500 p-3 rounded-lg">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{order.outlet.name}</h3>
                    <p className="text-gray-600">{order.outlet.addressLine1}</p>
                    <p className="text-gray-600">{order.outlet.city}</p>
                    {order.outlet.phone && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                        <Phone className="h-4 w-4" />
                        <span>{order.outlet.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-600" />
                  Order Items
                </h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-gray-500">× {item.quantity}</span>
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.modifiers.map((modifier) => (
                                <div key={modifier.modifierGroupId} className="text-sm text-gray-600">
                                  <span className="font-medium">{modifier.modifierGroupName}:</span>
                                  <span className="ml-1">
                                    {modifier.selectedOptions.map((opt) => opt.name).join(', ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 bg-orange-50 border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-gray-700">{order.specialInstructions}</p>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Order Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Order Placed</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {order.pickedUpAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Picked Up</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.pickedUpAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Delivered</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.deliveredAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Delivery Address
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                  <p className="text-sm text-gray-600">{order.deliveryAddress.phone}</p>
                  <p className="text-sm text-gray-600">{order.deliveryAddress.addressLine1}</p>
                  {order.deliveryAddress.addressLine2 && (
                    <p className="text-sm text-gray-600">{order.deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Delivery Agent Information */}
            {order.deliveryAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Delivery Partner
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.deliveryAgent.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${order.deliveryAgent.phone}`} className="text-blue-600 hover:underline">
                            {order.deliveryAgent.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your order is being delivered by our trusted delivery partner. You can contact them directly if needed.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Payment Information */}
            {order.payment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {order.payment.method === 'CASH' ? (
                      <Banknote className="h-5 w-5 text-orange-600" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    )}
                    Payment Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Method</span>
                      <span className="font-medium text-gray-900">
                        {order.payment.method === 'CASH'
                          ? 'Cash on Delivery'
                          : order.payment.method === 'UPI'
                          ? 'UPI'
                          : order.payment.method === 'CARD'
                          ? 'Card'
                          : 'Wallet'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Status</span>
                      <span
                        className={`font-medium ${
                          order.payment.status === 'COMPLETED'
                            ? 'text-green-600'
                            : order.payment.status === 'PENDING'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {order.payment.status === 'COMPLETED'
                          ? 'Paid'
                          : order.payment.status === 'PENDING'
                          ? 'Pay at Delivery'
                          : order.payment.status === 'FAILED'
                          ? 'Failed'
                          : 'Refunded'}
                      </span>
                    </div>
                    {order.payment.method === 'CASH' && order.payment.status === 'PENDING' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">Note:</span> Please keep exact change ready
                          for a smooth delivery experience.
                        </p>
                      </div>
                    )}
                    {order.payment.transactionId && order.payment.method !== 'CASH' && (
                      <div className="flex justify-between text-gray-600">
                        <span>Transaction ID</span>
                        <span className="font-mono text-sm text-gray-900">{order.payment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Cancel Order Button */}
            {canCancel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
              >
                <Button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Order'
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
