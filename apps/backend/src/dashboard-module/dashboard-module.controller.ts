import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/generated/prisma/enums';
import { GetDashboardStatsDto, DateRange } from './dto/dashboard.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
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
