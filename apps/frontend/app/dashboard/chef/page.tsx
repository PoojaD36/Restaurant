'use client';

import { useState, useEffect } from 'react';
import { getChefOrders, claimOrder, markOrderReady } from '../../../lib/chef-api';
import { OrderStatus, ChefOrder, ChefOrderPool } from '../../../lib/order-types';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Loader2,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  UtensilsCrossed,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <CheckCircle className="h-4 w-4" /> },
  PREPARING: { label: 'Preparing', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: <Flame className="h-4 w-4" /> },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300', icon: <Package className="h-4 w-4" /> },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Package className="h-4 w-4" /> },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: <Package className="h-4 w-4" /> },
};

export default function ChefDashboardPage() {
  const [orderPool, setOrderPool] = useState<ChefOrderPool>({ pending: [], preparing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState<number | null>(null);
  const [isMarkingReady, setIsMarkingReady] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getChefOrders();

      if (response.success) {
        setOrderPool(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch chef orders:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimOrder = async (orderId: number) => {
    setIsClaiming(orderId);
    try {
      await claimOrder(orderId);
      await fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to claim order:', error);
      alert(error instanceof Error ? error.message : 'Failed to claim order');
    } finally {
      setIsClaiming(null);
    }
  };

  const handleMarkReady = async (orderId: number) => {
    setIsMarkingReady(orderId);
    try {
      await markOrderReady(orderId);
      await fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to mark order as ready:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark order as ready');
    } finally {
      setIsMarkingReady(null);
    }
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return date.toLocaleTimeString();
  };

  const renderOrderCard = (order: ChefOrder, isPreparing: boolean) => {
    const isExpanded = expandedOrder === order.id;
    const isProcessing = isPreparing ? isMarkingReady === order.id : isClaiming === order.id;

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <Badge className={statusConfig[order.status].color}>
                    {statusConfig[order.status].icon}
                    <span className="ml-1">{statusConfig[order.status].label}</span>
                  </Badge>
                  {isPreparing && order.startedAt && (
                    <span className="text-sm text-gray-500">
                      Started {formatTime(order.startedAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {order.total}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isPreparing ? (
                  <Button
                    onClick={() => handleClaimOrder(order.id)}
                    disabled={isClaiming === order.id}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isClaiming === order.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        Start Preparing
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={isMarkingReady === order.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isMarkingReady === order.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Ready
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t pt-3 mt-3">
                    {/* Order Items */}
                    <div className="mb-3">
                      <h4 className="font-semibold mb-2 text-sm">Items:</h4>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-sm flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-gray-600">₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="font-semibold">Note: </span>
                        {order.specialInstructions}
                      </div>
                    )}

                    {/* Delivery Information */}
                    <div className="p-3 bg-gray-50 rounded text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold">Delivery:</span>
                        <span>{order.deliveryName}</span>
                      </div>
                      <div className="pl-6 text-gray-600">
                        {order.deliveryAddressLine1}, {order.deliveryCity}
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <Phone className="h-3 w-3 text-gray-600" />
                        <span>{order.deliveryPhone}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Kitchen Dashboard
          </h1>
          <p className="text-gray-600 text-sm">Manage order preparation</p>
        </div>
        <Button
          onClick={fetchOrders}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {isLoading && orderPool.pending.length === 0 && orderPool.preparing.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Preparation */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Pending Preparation
              {orderPool.pending.length > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {orderPool.pending.length}
                </Badge>
              )}
            </h2>
            {orderPool.pending.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No orders waiting to be prepared</p>
              </Card>
            ) : (
              <div>
                {orderPool.pending.map((order) => renderOrderCard(order, false))}
              </div>
            )}
          </div>

          {/* My Active Orders */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600" />
              My Active Orders
              {orderPool.preparing.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  {orderPool.preparing.length}
                </Badge>
              )}
            </h2>
            {orderPool.preparing.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>You have no active orders</p>
              </Card>
            ) : (
              <div>
                {orderPool.preparing.map((order) => renderOrderCard(order, true))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
