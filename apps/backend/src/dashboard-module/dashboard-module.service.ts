import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '../database/generated/prisma/enums';
import { DateRange } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(dateRange: DateRange) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    switch (dateRange) {
      case DateRange.TODAY:
        return startOfDay;
      case DateRange.WEEK:
        return startOfWeek;
      case DateRange.MONTH:
        return startOfMonth;
      case DateRange.YEAR:
        return startOfYear;
      case DateRange.ALL:
        return new Date(0);
      default:
        return startOfDay;
    }
  }

  async getDashboardStats(
    userId: string,
    userRole: UserRole,
    dateRange: DateRange = DateRange.ALL,
    restaurantId?: string,
    outletId?: string,
  ) {
    try {
      const dateFilter = this.getDateFilter(dateRange);

      // Convert string IDs to numbers
      const restaurantIdNum = restaurantId ? parseInt(restaurantId) : undefined;
      const outletIdNum = outletId ? parseInt(outletId) : undefined;

      const restaurantFilter = restaurantIdNum ? { id: restaurantIdNum } : {};
      const outletFilter = outletIdNum ? { id: outletIdNum } : {};

      // If not SUPER_ADMIN, apply restaurant access filtering
      // For now, not implementing restaurant filtering as it requires complex relations
      const accessibleRestaurantIds = null;

      // Get counts with filters
      const [
        totalUsers,
        totalRestaurants,
        totalOutlets,
        totalCustomers,
        allTimeOrders,
        allTimeRevenue,
        todayOrdersResult,
        orderStatusCounts,
        menuItemsCounts,
      ] = await Promise.all([
        // Total users (excluding superadmin)
        this.prisma.user.count({
          where: {
            role: { not: 'SUPER_ADMIN' as UserRole },
          },
        }),

        // Total restaurants
        this.prisma.restaurant.count({
          where: restaurantIdNum ? { id: restaurantIdNum } : {},
        }),

        // Total outlets
        this.prisma.outlet.count({
          where: {
            ...(outletIdNum && { id: outletIdNum }),
            ...(restaurantIdNum && { restaurantId: restaurantIdNum }),
          },
        }),

        // Total customers
        this.prisma.customer.count(),

        // All-time orders
        this.prisma.order.count({
          where: {
            ...(outletIdNum && { outletId: outletIdNum }),
            ...(restaurantIdNum && {
              outlet: { restaurantId: restaurantIdNum },
            }),
          },
        }),

        // All-time revenue
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: PaymentStatus.COMPLETED,
            ...(outletIdNum && {
              order: { outletId: outletIdNum },
            }),
            ...(restaurantIdNum && {
              order: { outlet: { restaurantId: restaurantIdNum } },
            }),
          },
        }),

        // Today's orders
        this.prisma.order.aggregate({
          _count: { id: true },
          _sum: { total: true },
          where: {
            createdAt: { gte: dateFilter },
            ...(outletIdNum && { outletId: outletIdNum }),
            ...(restaurantIdNum && {
              outlet: { restaurantId: restaurantIdNum },
            }),
          },
        }),

        // Order status counts
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { id: true },
          where: {
            ...(outletIdNum && { outletId: outletIdNum }),
            ...(restaurantIdNum && {
              outlet: { restaurantId: restaurantIdNum },
            }),
          },
        }),

        // Menu items counts
        this.prisma.menuItem.aggregate({
          _count: { id: true },
          where: {
            status: 'AVAILABLE' as const,
          },
        }),
      ]);

      // Calculate total menu items
      const totalMenuItems = await this.prisma.menuItem.count();

      // Calculate average order value
      const avgOrderValue = allTimeOrders > 0
        ? Number(allTimeRevenue._sum.amount || 0) / allTimeOrders
        : 0;

      // Process order status counts
      const statusCounts = {
        pendingOrders: 0,
        confirmedOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        outForDeliveryOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      };

      orderStatusCounts.forEach(({ status, _count }) => {
        switch (status) {
          case OrderStatus.PENDING:
            statusCounts.pendingOrders = _count.id;
            break;
          case OrderStatus.CONFIRMED:
            statusCounts.confirmedOrders = _count.id;
            break;
          case OrderStatus.PREPARING:
            statusCounts.preparingOrders = _count.id;
            break;
          case OrderStatus.READY:
            statusCounts.readyOrders = _count.id;
            break;
          case OrderStatus.OUT_FOR_DELIVERY:
            statusCounts.outForDeliveryOrders = _count.id;
            break;
          case OrderStatus.DELIVERED:
            statusCounts.deliveredOrders = _count.id;
            break;
          case OrderStatus.CANCELLED:
            statusCounts.cancelledOrders = _count.id;
            break;
        }
      });

      return {
        totalUsers,
        totalRestaurants,
        totalOutlets,
        totalCustomers,
        totalOrders: allTimeOrders,
        totalRevenue: allTimeRevenue._sum.amount || 0,
        pendingOrders: statusCounts.pendingOrders,
        confirmedOrders: statusCounts.confirmedOrders,
        preparingOrders: statusCounts.preparingOrders,
        readyOrders: statusCounts.readyOrders,
        outForDeliveryOrders: statusCounts.outForDeliveryOrders,
        deliveredOrders: statusCounts.deliveredOrders,
        cancelledOrders: statusCounts.cancelledOrders,
        averageOrderValue: Math.round(avgOrderValue * 100) / 100,
        todayRevenue: todayOrdersResult._sum.total || 0,
        todayOrders: todayOrdersResult._count.id,
        activeMenuItems: menuItemsCounts._count.id,
        totalMenuItems,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch dashboard statistics');
    }
  }

  async getRecentOrders(
    userId: string,
    userRole: UserRole,
    limit: number = 10,
    outletId?: string,
  ) {
    try {
      const outletIdNum = outletId ? parseInt(outletId) : undefined;

      const orders = await this.prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          ...(outletIdNum && { outletId: outletIdNum }),
        },
        include: {
          outlet: {
            select: {
              name: true,
            },
          },
        },
      });

      // Get customer details for all orders
      const customerIds = orders.map((o) => o.customerId);
      const customers = customerIds.length > 0
        ? await this.prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, firstName: true, phone: true },
          })
        : [];

      const customerMap = new Map(customers.map((c) => [c.id, c]));

      return orders.map((order) => {
        const customer = customerMap.get(order.customerId);
        return {
          id: order.id,
          orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt.toISOString(),
          customer: {
            name: customer?.firstName || 'Customer',
            phone: customer?.phone || '',
          },
          outlet: {
            name: order.outlet.name,
          },
        };
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch recent orders');
    }
  }

  async getRevenueAnalytics(
    userId: string,
    userRole: UserRole,
    dateRange: DateRange = DateRange.MONTH,
    outletId?: string,
  ) {
    try {
      const dateFilter = this.getDateFilter(dateRange);
      const outletIdNum = outletId ? parseInt(outletId) : undefined;

      const whereClause = {
        status: PaymentStatus.COMPLETED,
        ...(outletIdNum && {
          order: { outletId: outletIdNum },
        }),
        createdAt: { gte: dateFilter },
      };

      const [
        totalRevenueResult,
        completedPaymentsCount,
        pendingPaymentsCount,
        revenueByPaymentMethod,
        revenueByOutlet,
      ] = await Promise.all([
        // Total revenue
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: whereClause,
        }),

        // Completed payments count
        this.prisma.payment.count({
          where: {
            ...whereClause,
            status: PaymentStatus.COMPLETED,
          },
        }),

        // Pending payments count
        this.prisma.payment.count({
          where: {
            ...(outletIdNum && {
              order: { outletId: outletIdNum },
            }),
            createdAt: { gte: dateFilter },
            status: PaymentStatus.PENDING,
          },
        }),

        // Revenue by payment method
        this.prisma.payment.groupBy({
          by: ['method'],
          _sum: { amount: true },
          _count: { id: true },
          where: whereClause,
        }),

        // Revenue by outlet
        this.prisma.payment.findMany({
          select: {
            amount: true,
            order: {
              select: {
                outlet: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          where: whereClause,
        }),
      ]);

      // Process revenue by outlet
      const outletRevenueMap = new Map<
        number,
        { outletId: number; outletName: string; revenue: number; orderCount: number }
      >();
      revenueByOutlet.forEach(({ amount, order }) => {
        const key = order.outlet.id;
        if (!outletRevenueMap.has(key)) {
          outletRevenueMap.set(key, {
            outletId: order.outlet.id,
            outletName: order.outlet.name,
            revenue: 0,
            orderCount: 0,
          });
        }
        const data = outletRevenueMap.get(key)!;
        data.revenue += Number(amount);
        data.orderCount += 1;
      });

      return {
        totalRevenue: totalRevenueResult._sum.amount || 0,
        completedPayments: completedPaymentsCount,
        pendingPayments: pendingPaymentsCount,
        revenueByPaymentMethod: revenueByPaymentMethod.map(({ method, _sum, _count }) => ({
          method,
          amount: _sum.amount || 0,
          count: _count.id,
        })),
        revenueByOutlet: Array.from(outletRevenueMap.values()),
        dailyRevenue: [], // To be implemented with daily aggregation
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch revenue analytics');
    }
  }

  async getPopularItems(
    userId: string,
    userRole: UserRole,
    limit: number = 10,
    outletId?: string,
  ) {
    try {
      const outletIdNum = outletId ? parseInt(outletId) : undefined;

      // Get all order items and aggregate by menu item ID
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          ...(outletIdNum && {
            order: { outletId: outletIdNum },
          }),
        },
        select: {
          menuItemId: true,
          name: true,
          quantity: true,
          price: true,
        },
      });

      // Aggregate by menu item ID
      const itemMap = new Map<
        number,
        { id: number; name: string; orderCount: number; revenue: number }
      >();

      orderItems.forEach(({ menuItemId, name, quantity, price }) => {
        const priceNum = Number(price);
        if (!itemMap.has(menuItemId)) {
          itemMap.set(menuItemId, {
            id: menuItemId,
            name: name,
            orderCount: 0,
            revenue: 0,
          });
        }
        const data = itemMap.get(menuItemId)!;
        data.orderCount += quantity;
        data.revenue += priceNum * quantity;
      });

      // Sort by order count and limit
      return Array.from(itemMap.values())
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limit)
        .map((item) => ({
          ...item,
          categoryName: 'All Categories', // OrderItems don't have category info
        }));
    } catch (error) {
      throw new BadRequestException('Failed to fetch popular items');
    }
  }

  async getStaffPerformance(
    userId: string,
    userRole: UserRole,
    outletId?: string,
  ) {
    try {
      const outletIdNum = outletId ? parseInt(outletId) : undefined;

      const whereClause = {
        ...(outletIdNum && { outletId: outletIdNum }),
      };

      // Get chef performance
      const chefs = await this.prisma.user.findMany({
        where: {
          role: UserRole.CHEF,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      const chefPerformance = await Promise.all(
        chefs.map(async (chef) => {
          const orders = await this.prisma.order.findMany({
            where: {
              chefId: chef.id,
              ...whereClause,
              status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY] },
            },
            select: {
              startedAt: true,
              completedAt: true,
            },
          });

          const preparationTimes = orders
            .filter((o) => o.startedAt && o.completedAt)
            .map((o) => {
              const start = new Date(o.startedAt!).getTime();
              const end = new Date(o.completedAt!).getTime();
              return (end - start) / 1000 / 60; // in minutes
            });

          const avgPrepTime =
            preparationTimes.length > 0
              ? preparationTimes.reduce((a, b) => a + b, 0) / preparationTimes.length
              : 0;

          return {
            id: chef.id,
            name: `${chef.firstName} ${chef.lastName || ''}`.trim(),
            ordersPrepared: orders.length,
            averagePreparationTime: Math.round(avgPrepTime),
          };
        }),
      );

      // Get delivery agent performance
      const deliveryAgents = await this.prisma.user.findMany({
        where: {
          role: UserRole.DELIVERY_AGENT,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      const agentPerformance = await Promise.all(
        deliveryAgents.map(async (agent) => {
          const orders = await this.prisma.order.findMany({
            where: {
              deliveryAgentId: agent.id,
              ...whereClause,
              status: OrderStatus.DELIVERED,
            },
            select: {
              pickedUpAt: true,
              deliveredAt: true,
              createdAt: true,
              completedAt: true,
            },
          });

          const deliveryTimes = orders
            .filter((o) => o.pickedUpAt && o.deliveredAt)
            .map((o) => {
              const start = new Date(o.pickedUpAt!).getTime();
              const end = new Date(o.deliveredAt!).getTime();
              return (end - start) / 1000 / 60; // in minutes
            });

          const avgDeliveryTime =
            deliveryTimes.length > 0
              ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
              : 0;

          // Calculate on-time delivery rate (assuming 45 min is on-time)
          const onTimeDeliveries = deliveryTimes.filter((t) => t <= 45).length;
          const onTimeRate = orders.length > 0 ? (onTimeDeliveries / orders.length) * 100 : 0;

          return {
            id: agent.id,
            name: `${agent.firstName} ${agent.lastName || ''}`.trim(),
            ordersDelivered: orders.length,
            averageDeliveryTime: Math.round(avgDeliveryTime),
            onTimeDeliveryRate: Math.round(onTimeRate),
          };
        }),
      );

      return {
        chefs: chefPerformance,
        deliveryAgents: agentPerformance,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch staff performance');
    }
  }
}
