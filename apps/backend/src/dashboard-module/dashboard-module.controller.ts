import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/generated/prisma/enums';
import { GetDashboardStatsDto, DateRange } from './dto/dashboard.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Retrieve comprehensive dashboard statistics including users, restaurants, outlets, customers, orders, revenue, order status counts, average order value, today\'s metrics, and menu items.',
  })
  @ApiQuery({
    name: 'dateRange',
    required: false,
    enum: DateRange,
    description: 'Filter statistics by date range',
    example: DateRange.ALL,
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    type: String,
    description: 'Filter by restaurant ID',
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    type: String,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Dashboard statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 15 },
            totalRestaurants: { type: 'number', example: 5 },
            totalOutlets: { type: 'number', example: 10 },
            totalCustomers: { type: 'number', example: 150 },
            totalOrders: { type: 'number', example: 500 },
            totalRevenue: { type: 'number', example: 75000 },
            pendingOrders: { type: 'number', example: 5 },
            confirmedOrders: { type: 'number', example: 10 },
            preparingOrders: { type: 'number', example: 8 },
            readyOrders: { type: 'number', example: 3 },
            outForDeliveryOrders: { type: 'number', example: 7 },
            deliveredOrders: { type: 'number', example: 450 },
            cancelledOrders: { type: 'number', example: 17 },
            averageOrderValue: { type: 'number', example: 150 },
            todayRevenue: { type: 'number', example: 2500 },
            todayOrders: { type: 'number', example: 20 },
            activeMenuItems: { type: 'number', example: 85 },
            totalMenuItems: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getDashboardStats(
    @Req() req: any,
    @Query('dateRange') dateRange: DateRange = DateRange.ALL,
    @Query('restaurantId') restaurantId?: string,
    @Query('outletId') outletId?: string,
  ) {
    const stats = await this.dashboardService.getDashboardStats(
      req.user.userId,
      req.user.role,
      dateRange,
      restaurantId,
      outletId,
    );

    return {
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('recent-orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get recent orders',
    description: 'Retrieve recent orders with customer details and outlet information.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of orders to retrieve',
    example: 10,
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    type: String,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Recent orders retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 123 },
              orderNumber: { type: 'string', example: 'ORD-000123' },
              status: { type: 'string', example: 'DELIVERED' },
              total: { type: 'number', example: 450 },
              createdAt: { type: 'string', example: '2024-06-30T10:30:00Z' },
              customer: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  phone: { type: 'string', example: '+1234567890' },
                },
              },
              outlet: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Downtown Branch' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRecentOrders(
    @Req() req: any,
    @Query('limit') limit: number = 10,
    @Query('outletId') outletId?: string,
  ) {
    const orders = await this.dashboardService.getRecentOrders(
      req.user.userId,
      req.user.role,
      limit,
      outletId,
    );

    return {
      success: true,
      message: 'Recent orders retrieved successfully',
      data: orders,
    };
  }

  @Get('revenue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Retrieve revenue analytics including total revenue, payment method breakdown, outlet breakdown, and daily trends.',
  })
  @ApiQuery({
    name: 'dateRange',
    required: false,
    enum: DateRange,
    description: 'Filter revenue by date range',
    example: DateRange.MONTH,
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    type: String,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Revenue analytics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number', example: 25000 },
            completedPayments: { type: 'number', example: 150 },
            pendingPayments: { type: 'number', example: 5 },
            revenueByPaymentMethod: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  method: { type: 'string', example: 'CARD' },
                  amount: { type: 'number', example: 15000 },
                  count: { type: 'number', example: 90 },
                },
              },
            },
            revenueByOutlet: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  outletId: { type: 'number', example: 1 },
                  outletName: { type: 'string', example: 'Downtown Branch' },
                  revenue: { type: 'number', example: 15000 },
                  orderCount: { type: 'number', example: 100 },
                },
              },
            },
            dailyRevenue: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', example: '2024-06-30' },
                  revenue: { type: 'number', example: 2500 },
                  orderCount: { type: 'number', example: 15 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getRevenueAnalytics(
    @Req() req: any,
    @Query('dateRange') dateRange: DateRange = DateRange.MONTH,
    @Query('outletId') outletId?: string,
  ) {
    const analytics = await this.dashboardService.getRevenueAnalytics(
      req.user.userId,
      req.user.role,
      dateRange,
      outletId,
    );

    return {
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('popular-items')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get popular items',
    description: 'Retrieve most ordered items with order count and revenue.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of popular items to retrieve',
    example: 10,
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    type: String,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular items retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Popular items retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 5 },
              name: { type: 'string', example: 'Butter Chicken' },
              categoryName: { type: 'string', example: 'Main Course' },
              orderCount: { type: 'number', example: 150 },
              revenue: { type: 'number', example: 22500 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getPopularItems(
    @Req() req: any,
    @Query('limit') limit: number = 10,
    @Query('outletId') outletId?: string,
  ) {
    const items = await this.dashboardService.getPopularItems(
      req.user.userId,
      req.user.role,
      limit,
      outletId,
    );

    return {
      success: true,
      message: 'Popular items retrieved successfully',
      data: items,
    };
  }

  @Get('staff-performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get staff performance',
    description: 'Retrieve performance metrics for chefs and delivery agents including preparation times, delivery times, and on-time delivery rates.',
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    type: String,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff performance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Staff performance retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            chefs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 10 },
                  name: { type: 'string', example: 'Chef John' },
                  ordersPrepared: { type: 'number', example: 85 },
                  averagePreparationTime: { type: 'number', example: 18 },
                },
              },
            },
            deliveryAgents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 12 },
                  name: { type: 'string', example: 'Agent Mike' },
                  ordersDelivered: { type: 'number', example: 120 },
                  averageDeliveryTime: { type: 'number', example: 25 },
                  onTimeDeliveryRate: { type: 'number', example: 92 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getStaffPerformance(
    @Req() req: any,
    @Query('outletId') outletId?: string,
  ) {
    const performance = await this.dashboardService.getStaffPerformance(
      req.user.userId,
      req.user.role,
      outletId,
    );

    return {
      success: true,
      message: 'Staff performance retrieved successfully',
      data: performance,
    };
  }
}
