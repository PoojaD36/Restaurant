'use client';

/**
 * Customer Orders Page
 *
 * Displays a list of all customer orders with status tracking and order details.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { getMyOrders } from '@/lib/order-api';
import { OrderListItem, OrderStatus } from '@/lib/order-types';
import {
  ShoppingBag,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  IndianRupee,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CustomerHeader } from '@/components/customer-header';
import { CustomerBottomNav } from '@/components/customer-bottom-nav';

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-emerald-100 text-orange-800 border-emerald-200',
  READY: 'bg-purple-100 text-purple-800 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function CustomerOrdersPage() {
  const { isAuthenticated, getCustomerToken } = useCustomerAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/customer');
      return;
    }
    loadOrders();
  }, [isAuthenticated, page]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const token = getCustomerToken();
      if (!token) {
        router.push('/customer');
        return;
      }

      const response = await getMyOrders(token, page, 10);
      if (response.success) {
        setOrders(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalOrders(response.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getOrderSummary = (order: OrderListItem) => {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemNames = order.items.slice(0, 2).map(item => item.name);
    if (order.items.length > 2) {
      itemNames.push(`+${order.items.length - 2} more`);
    }
    return {
      itemCount,
      itemNames: itemNames.join(', '),
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Header */}
      <CustomerHeader title="My Orders" showBackButton onBackClick={() => router.push('/customer')} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <ShoppingBag className="h-10 w-10 opacity-80" />
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders. Start ordering from your favorite restaurants!
            </p>
            <Button
              onClick={() => router.push('/customer')}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              Browse Restaurants
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order, index) => {
                const { itemCount, itemNames } = getOrderSummary(order);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/customer/orders/${order.id}`)}
                    >
                      <div className="p-4 sm:p-6">
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {order.outlet.name}
                              </h3>
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {/* Payment Badge (if available in OrderListItem) */}
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                {order.total > 0 ? (
                                  <>
                                    <CreditCard className="h-3 w-3" />
                                    <span>Paid</span>
                                  </>
                                ) : (
                                  <>
                                    <Banknote className="h-3 w-3" />
                                    <span>COD</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              <IndianRupee className="h-4 w-4 inline" />
                              {order.total.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">Order #{order.id}</p>
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600">
                            {itemCount} item{itemCount > 1 ? 's' : ''}: {itemNames}
                          </p>
                        </div>

                        {/* Delivery Address */}
                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {order.deliveryAddressLine1}, {order.deliveryCity}
                          </span>
                        </div>

                        {/* Order Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {order.status === OrderStatus.DELIVERED && order.deliveredAt
                                ? `Delivered ${formatDate(order.deliveredAt)}`
                                : `Placed ${formatDate(order.createdAt)}`}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <CustomerBottomNav />
    </div>
  );
}
