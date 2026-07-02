'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Users,
  Utensils,
  ShoppingBag,
  TrendingUp,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { getDashboardStats, getRecentOrders } from '../../lib/dashboard-api';
import type { DashboardStats, RecentOrder } from '../../lib/dashboard-api';
import { useAuth } from '../../contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(5),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (ordersResponse.success && ordersResponse.data) {
        setRecentOrders(ordersResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'READY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-emerald-100 text-orange-800 border-emerald-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      description: `${stats?.todayOrders || 0} today`,
      color: 'from-emerald-500 to-teal-500',
      change: stats?.todayOrders ? '+Today' : '',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      description: `${formatCurrency(stats?.todayRevenue || 0)} today`,
      color: 'from-green-500 to-emerald-500',
      change: '+Lifetime',
    },
    {
      title: 'Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      description: 'Registered customers',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Avg Order',
      value: formatCurrency(stats?.averageOrderValue || 0),
      icon: DollarSign,
      description: 'Per order',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const orderStatusCards = [
    { label: 'Pending', count: stats?.pendingOrders || 0, color: 'bg-yellow-500', icon: Clock },
    { label: 'Confirmed', count: stats?.confirmedOrders || 0, color: 'bg-blue-500', icon: CheckCircle2 },
    { label: 'Preparing', count: stats?.preparingOrders || 0, color: 'bg-purple-500', icon: Utensils },
    { label: 'Ready', count: stats?.readyOrders || 0, color: 'bg-indigo-500', icon: CheckCircle2 },
    { label: 'Out for Delivery', count: stats?.outForDeliveryOrders || 0, color: 'bg-emerald-500', icon: ShoppingBag },
    { label: 'Delivered', count: stats?.deliveredOrders || 0, color: 'bg-green-500', icon: CheckCircle2 },
  ];

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER']}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-slate-600">
            Here's what's happening with your restaurant today.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className="border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/10 transition-all bg-white/80 backdrop-blur"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Status Overview */}
            <Card className="border-emerald-100 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-500" />
                  Order Status Overview
                </CardTitle>
                <CardDescription>
                  Current order status distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {orderStatusCards.map((status) => {
                    const Icon = status.icon;
                    return (
                      <div
                        key={status.label}
                        className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div className={`${status.color} w-8 h-8 rounded-full flex items-center justify-center mb-2`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-lg font-bold">{status.count}</div>
                        <div className="text-xs text-slate-500">{status.label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Orders */}
              <Card className="border-emerald-100 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-500" />
                      Recent Orders
                    </span>
                    <a
                      href="/dashboard/orders"
                      className="text-sm text-emerald-500 hover:text-emerald-600 flex items-center"
                    >
                      View All <ChevronRight className="h-4 w-4" />
                    </a>
                  </CardTitle>
                  <CardDescription>Latest orders across all outlets</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No orders yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.status)} variant="outline">
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {order.customer.name} • {order.outlet.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(order.total)}</div>
                            <div className="text-xs text-slate-500">
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-emerald-100 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>Your business at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Total Restaurants</div>
                          <div className="text-xs text-slate-500">Active outlets</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{stats?.totalRestaurants || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Total Outlets</div>
                          <div className="text-xs text-slate-500">Operating locations</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{stats?.totalOutlets || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Total Users</div>
                          <div className="text-xs text-slate-500">System users</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{stats?.totalUsers || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Active Menu Items</div>
                          <div className="text-xs text-slate-500">Available items</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{stats?.activeMenuItems || 0}</div>
                    </div>

                    {stats && stats.cancelledOrders > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-red-700">Cancelled Orders</div>
                            <div className="text-xs text-red-500">Needs attention</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-red-600">{stats.cancelledOrders}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
