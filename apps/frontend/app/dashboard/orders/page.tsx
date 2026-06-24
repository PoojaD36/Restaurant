'use client';

import { useState, useEffect } from 'react';
import { getOutletOrders, updateOrderStatus } from '../../../lib/order-api';
import { getAllOutlets } from '../../../lib/outlets-api';
import { OrderStatus, OrderListItem } from '../../../lib/order-types';
import { OutletListItem } from '../../../lib/types';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Clock,
  CheckCircle,
  Utensils,
  Truck,
  Package,
  XCircle,
  Loader2,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; nextStatuses?: OrderStatus[] }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-4 w-4" />, nextStatuses: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED] },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <CheckCircle className="h-4 w-4" />, nextStatuses: [OrderStatus.PREPARING, OrderStatus.CANCELLED] },
  PREPARING: { label: 'Preparing', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Utensils className="h-4 w-4" />, nextStatuses: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300', icon: <Package className="h-4 w-4" />, nextStatuses: [OrderStatus.OUT_FOR_DELIVERY] },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Truck className="h-4 w-4" />, nextStatuses: [OrderStatus.DELIVERED] },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-4 w-4" /> },
};

const statusOrder: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export default function OrdersManagementPage() {
  const [outlets, setOutlets] = useState<OutletListItem[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Fetch user's outlets on mount
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await getAllOutlets(1, 100);

        if (response.success && response.data && response.data.length > 0) {
          setOutlets(response.data);
          setSelectedOutlet(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch outlets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  // Fetch orders when outlet or filter changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedOutlet) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const status = filterStatus === 'all' ? undefined : filterStatus;
        const response = await getOutletOrders(token, selectedOutlet, status);

        if (response.success) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedOutlet, filterStatus]);

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await updateOrderStatus(token, orderId, newStatus);

      if (response.success) {
        // Update the order in the list
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? { ...order, status: newStatus }
              : order,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(o => o.status === status).length;
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  if (isLoading && outlets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (outlets.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Outlets Found</h2>
        <p className="text-gray-600">You don't have access to any outlets yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-1">Manage and track orders for your outlets</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Outlet Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Outlet
            </label>
            <Select value={selectedOutlet || ''} onValueChange={(v) => setSelectedOutlet(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={String(outlet.id)}>
                    {outlet.name} - {outlet.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as OrderStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {statusOrder.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status].label} ({getStatusCount(status)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2 mt-4">
          {statusOrder.map((status) => (
            <Badge
              key={status}
              className={`${statusConfig[status].color} border cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setFilterStatus(status)}
            >
              {statusConfig[status].label}: {getStatusCount(status)}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600">
            {filterStatus === 'all'
              ? 'There are no orders for this outlet yet.'
              : `There are no ${statusConfig[filterStatus as OrderStatus]?.label.toLowerCase()} orders.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const isExpanded = expandedOrder === order.id;
            const isUpdatingThis = isUpdating === order.id;

            return (
              <Card key={order.id} className="overflow-hidden">
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
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.total}
                      </p>

                      <p className="text-xs text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Status Update Dropdown */}
                      {statusInfo.nextStatuses && statusInfo.nextStatuses.length > 0 && (
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                          disabled={isUpdatingThis}
                        >
                          <SelectTrigger className="w-40" disabled={isUpdatingThis}>
                            {isUpdatingThis ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Update Status
                              </>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {statusInfo.nextStatuses.map((status) => {
                              const nextStatus = statusConfig[status];
                              return (
                                <SelectItem key={status} value={status}>
                                  <span className="flex items-center gap-2">
                                    {nextStatus.icon}
                                    {nextStatus.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Expand/Collapse Button */}
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
                              {order.items.map((item) => (
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

                          {/* Delivery Info */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{order.deliveryAddressLine1}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{order.deliveryPhone}</span>
                              </div>
                            </div>
                          </div>

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
      )}
    </div>
  );
}
