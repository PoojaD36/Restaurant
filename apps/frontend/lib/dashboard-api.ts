const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalOutlets: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  readyOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  todayRevenue: number;
  todayOrders: number;
  activeMenuItems: number;
  totalMenuItems: number;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
  outlet: {
    name: string;
  };
}

export interface RevenueAnalytics {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  revenueByPaymentMethod: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  revenueByOutlet: Array<{
    outletId: number;
    outletName: string;
    revenue: number;
    orderCount: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}

export interface PopularItem {
  id: number;
  name: string;
  categoryName: string;
  orderCount: number;
  revenue: number;
}

export interface StaffPerformance {
  chefs: Array<{
    id: number;
    name: string;
    ordersPrepared: number;
    averagePreparationTime: number;
  }>;
  deliveryAgents: Array<{
    id: number;
    name: string;
    ordersDelivered: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  }>;
}

// Dashboard API functions
export async function getDashboardStats(dateRange?: string, restaurantId?: string, outletId?: string): Promise<{
  success: boolean;
  message: string;
  data?: DashboardStats;
}> {
  const params = new URLSearchParams();
  if (dateRange) params.append('dateRange', dateRange);
  if (restaurantId) params.append('restaurantId', restaurantId);
  if (outletId) params.append('outletId', outletId);

  return request(`/dashboard/stats?${params.toString()}`);
}

export async function getRecentOrders(limit: number = 10, outletId?: string): Promise<{
  success: boolean;
  message: string;
  data?: RecentOrder[];
}> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (outletId) params.append('outletId', outletId);

  return request(`/dashboard/recent-orders?${params.toString()}`);
}

export async function getRevenueAnalytics(dateRange?: string, outletId?: string): Promise<{
  success: boolean;
  message: string;
  data?: RevenueAnalytics;
}> {
  const params = new URLSearchParams();
  if (dateRange) params.append('dateRange', dateRange);
  if (outletId) params.append('outletId', outletId);

  return request(`/dashboard/revenue?${params.toString()}`);
}

export async function getPopularItems(limit: number = 10, outletId?: string): Promise<{
  success: boolean;
  message: string;
  data?: PopularItem[];
}> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (outletId) params.append('outletId', outletId);

  return request(`/dashboard/popular-items?${params.toString()}`);
}

export async function getStaffPerformance(outletId?: string): Promise<{
  success: boolean;
  message: string;
  data?: StaffPerformance;
}> {
  const params = new URLSearchParams();
  if (outletId) params.append('outletId', outletId);

  return request(`/dashboard/staff-performance?${params.toString()}`);
}
