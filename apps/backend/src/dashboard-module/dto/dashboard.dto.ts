import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../database/generated/prisma/enums';

export enum DateRange {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

export class GetDashboardStatsDto {
  @IsOptional()
  @IsEnum(DateRange)
  dateRange?: DateRange;

  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  outletId?: string;
}

export class DashboardStatsResponse {
  success!: boolean;
  message!: string;
  data?: {
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
  };
}

export class RecentOrdersResponse {
  success!: boolean;
  message!: string;
  data?: Array<{
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
  }>;
}

export class RevenueAnalyticsResponse {
  success!: boolean;
  message!: string;
  data?: {
    totalRevenue: number;
    completedPayments: number;
    pendingPayments: number;
    revenueByPaymentMethod: Array<{
      method: string;
      amount: number;
      count: number;
    }>;
    revenueByOutlet: Array<{
      outletId: string;
      outletName: string;
      revenue: number;
      orderCount: number;
    }>;
    dailyRevenue: Array<{
      date: string;
      revenue: number;
      orderCount: number;
    }>;
  };
}

export class PopularItemsResponse {
  success!: boolean;
  message!: string;
  data?: Array<{
    id: number;
    name: string;
    categoryName: string;
    orderCount: number;
    revenue: number;
    imageUrl?: string;
  }>;
}

export class StaffPerformanceResponse {
  success!: boolean;
  message!: string;
  data?: {
    chefs: Array<{
      id: string;
      name: string;
      ordersPrepared: number;
      averagePreparationTime: number;
    }>;
    deliveryAgents: Array<{
      id: string;
      name: string;
      ordersDelivered: number;
      averageDeliveryTime: number;
      onTimeDeliveryRate: number;
    }>;
  };
}
