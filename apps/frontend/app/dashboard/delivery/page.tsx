'use client';

import { useState, useEffect } from 'react';
import { getDeliveryAgentOrders, updateDeliveryLocation, markOrderAsDelivered } from '../../../lib/order-api';
import { OrderStatus, OrderListItem, PaymentStatus } from '../../../lib/order-types';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { CollectPaymentModal } from '../../../components/collect-payment-modal';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  Loader2,
  Phone,
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
  IndianRupee,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <CheckCircle className="h-4 w-4" /> },
  PREPARING: { label: 'Preparing', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Package className="h-4 w-4" /> },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300', icon: <Package className="h-4 w-4" /> },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Truck className="h-4 w-4" /> },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: <Package className="h-4 w-4" /> },
};

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<number | null>(null);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState<number | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await getDeliveryAgentOrders(token, 1, 50);

      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch delivery orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async (orderId: number) => {
    setIsUpdatingLocation(orderId);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateDeliveryLocation(token, orderId, latitude, longitude);
            setIsUpdatingLocation(null);
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please enable location services.');
            setIsUpdatingLocation(null);
          },
        );
      } else {
        alert('Geolocation is not supported by your browser.');
        setIsUpdatingLocation(null);
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location');
      setIsUpdatingLocation(null);
    }
  };

  const getDirections = (lat: number | undefined, lng: number | undefined) => {
    if (lat === undefined || lng === undefined) {
      alert('Delivery coordinates not available');
      return;
    }
    // Open Google Maps with the destination
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleMarkAsDelivered = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check payment status
    const isPendingPayment = order.payment && order.payment.status === PaymentStatus.PENDING;

    if (isPendingPayment) {
      // Show payment collection modal for COD orders
      setSelectedOrder(order);
      setPaymentModalOpen(true);
    } else {
      // For prepaid orders, confirm directly
      if (!confirm('Are you sure you want to mark this order as delivered?')) {
        return;
      }
      await processMarkAsDelivered(orderId);
    }
  };

  const processMarkAsDelivered = async (
    orderId: number,
    paymentMethod?: 'CASH' | 'UPI',
    transactionId?: string,
  ) => {
    setIsMarkingDelivered(orderId);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await markOrderAsDelivered(token, orderId, paymentMethod, transactionId);

      if (response.success) {
        // Update the order in the list
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? { ...order, status: OrderStatus.DELIVERED, deliveredAt: new Date().toISOString() }
              : order,
          ),
        );
        alert('Order marked as delivered successfully!');
        setPaymentModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      console.error('Failed to mark order as delivered:', error);
      alert(error.message || 'Failed to mark order as delivered');
    } finally {
      setIsMarkingDelivered(null);
    }
  };

  const handlePaymentConfirm = async (paymentMethod: 'CASH' | 'UPI', transactionId?: string) => {
    if (selectedOrder) {
      await processMarkAsDelivered(selectedOrder.id, paymentMethod, transactionId);
    }
  };

  const activeOrders = orders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your delivery orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Deliveries</p>
              <p className="text-3xl font-bold text-emerald-600">{activeOrders.length}</p>
            </div>
            <Truck className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-3xl font-bold text-green-600">{deliveredOrders.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-blue-600">
                <IndianRupee className="h-5 w-5 inline" />
                {orders.reduce((sum, order) => sum + (order.status === OrderStatus.DELIVERED ? order.deliveryFee || 30 : 0), 0)}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const statusInfo = statusConfig[order.status];
              const isExpanded = expandedOrder === order.id;
              const isUpdatingThis = isUpdatingLocation === order.id;

              return (
                <Card key={order.id} className="overflow-hidden border-2 border-emerald-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{order.id}
                          </h3>
                          <Badge className={`${statusInfo.color} border`}>
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.label}</span>
                          </Badge>
                          {order.payment && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <IndianRupee className="h-3 w-3" />
                              <span className="ml-1">{order.payment.method === 'CASH' ? 'COD' : 'Paid'}</span>
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.total}
                        </p>

                        <p className="text-xs text-gray-500">
                          From: {order.outlet.name}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleUpdateLocation(order.id)}
                          disabled={isUpdatingThis}
                          size="sm"
                          variant="outline"
                        >
                          {isUpdatingThis ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Update Location
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleMarkAsDelivered(order.id)}
                          disabled={isMarkingDelivered === order.id}
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isMarkingDelivered === order.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Delivered
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                            {/* Items */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-start text-sm">
                                    <div>
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-gray-500 ml-2">× {item.quantity}</span>
                                    </div>
                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Delivery Address */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Delivery Address</h4>
                              <div className="bg-emerald-50 p-4 rounded-lg space-y-2">
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{order.deliveryName}</p>
                                    <p className="text-gray-600">{order.deliveryAddressLine1}</p>
                                    {order.deliveryAddressLine2 && (
                                      <p className="text-gray-600">{order.deliveryAddressLine2}</p>
                                    )}
                                    <p className="text-gray-600">{order.deliveryCity}, {order.deliveryState} {order.deliveryPostalCode}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-emerald-600" />
                                  <a
                                    href={`tel:${order.deliveryPhone}`}
                                    className="text-emerald-600 hover:underline font-medium"
                                  >
                                    {order.deliveryPhone}
                                  </a>
                                </div>
                                <Button
                                  onClick={() => getDirections(
                                    order.deliveryLatitude,
                                    order.deliveryLongitude
                                  )}
                                  size="sm"
                                  className="w-full mt-2"
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Get Directions
                                </Button>
                              </div>
                            </div>

                            {/* Payment Info */}
                            {order.payment && order.payment.method === 'CASH' && (
                              <div className="bg-yellow-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800">
                                  💵 Cash on Delivery: ₹{order.total}
                                </p>
                              </div>
                            )}

                            {/* Special Instructions */}
                            {order.specialInstructions && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                  {order.specialInstructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {deliveredOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Deliveries</h2>
          <div className="space-y-3">
            {deliveredOrders.map((order) => (
              <Card key={order.id} className="p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      Delivered to {order.deliveryCity} • ₹{order.total}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Orders */}
      {orders.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliveries Yet</h3>
          <p className="text-gray-600">You don't have any assigned deliveries.</p>
        </Card>
      )}

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handlePaymentConfirm}
        totalAmount={selectedOrder?.total || 0}
        orderId={selectedOrder?.id || 0}
        isLoading={isMarkingDelivered !== null}
      />
    </div>
  );
}
