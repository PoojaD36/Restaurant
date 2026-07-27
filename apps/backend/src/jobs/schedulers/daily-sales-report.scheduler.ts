import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email-module/email.service';

@Injectable()
export class DailySalesReportScheduler {
  private readonly logger = new Logger(DailySalesReportScheduler.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Cron('0 0 16 * * *', {
    name: 'daily-sales-report',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailySalesReport() {
    this.logger.log('📊 Generating daily sales report...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      // Get today's orders with full details
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          status: { not: 'CANCELLED' },
        },
        include: {
          items: true,
          payment: true,
          outlet: {
            include: {
              restaurant: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate overall statistics
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Payment method breakdown
      const paymentBreakdown = {
        online: orders.filter(
          (o) => o.payment?.method === 'CARD' || o.payment?.method === 'UPI' || o.payment?.method === 'WALLET',
        ).length,
        cash: orders.filter((o) => o.payment?.method === 'CASH').length,
        onlineRevenue: orders
          .filter(
            (o) => o.payment?.method === 'CARD' || o.payment?.method === 'UPI' || o.payment?.method === 'WALLET',
          )
          .reduce((sum, o) => sum + Number(o.total), 0),
        cashRevenue: orders
          .filter((o) => o.payment?.method === 'CASH')
          .reduce((sum, o) => sum + Number(o.total), 0),
      };

      // Order status breakdown
      const statusBreakdown = orders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Restaurant/Outlet breakdown
      const restaurantBreakdown = orders.reduce((acc, order) => {
        const restaurantName = order.outlet.restaurant.name;
        const outletName = order.outlet.name;
        const key = `${restaurantName} - ${outletName}`;

        if (!acc[key]) {
          acc[key] = {
            restaurant: restaurantName,
            outlet: outletName,
            orderCount: 0,
            revenue: 0,
          };
        }

        acc[key].orderCount += 1;
        acc[key].revenue += Number(order.total);

        return acc;
      }, {} as Record<string, { restaurant: string; outlet: string; orderCount: number; revenue: number }>);

      // Top selling items
      const itemSales = orders.reduce(
        (acc, order) => {
          for (const item of order.items) {
            if (!acc[item.menuItemId]) {
              acc[item.menuItemId] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
              };
            }
            acc[item.menuItemId].quantity += item.quantity;
            acc[item.menuItemId].revenue += Number(item.price) * item.quantity;
          }
          return acc;
        },
        {} as Record<number, { name: string; quantity: number; revenue: number }>,
      );

      const topItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // New customers (who placed their first order today)
      const newCustomerIds = new Set(
        (
          await this.prisma.order.findMany({
            where: {
              createdAt: {
                gte: today,
                lt: tomorrow,
              },
            },
            select: { customerId: true },
            distinct: ['customerId'],
          })
        ).map((o) => o.customerId),
      );

      const existingCustomerIds = new Set(
        (
          await this.prisma.order.findMany({
            where: {
              createdAt: {
                lt: today,
              },
            },
            select: { customerId: true },
            distinct: ['customerId'],
          })
        ).map((o) => o.customerId),
      );

      const newCustomersCount = [...newCustomerIds].filter((id) => !existingCustomerIds.has(id)).length;

      // Compile the report
      const report = {
        date: today.toISOString().split('T')[0],
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          newCustomers: newCustomersCount,
        },
        paymentBreakdown: {
          online: {
            count: paymentBreakdown.online,
            revenue: Math.round(paymentBreakdown.onlineRevenue),
          },
          cash: {
            count: paymentBreakdown.cash,
            revenue: Math.round(paymentBreakdown.cashRevenue),
          },
        },
        statusBreakdown,
        restaurantBreakdown: Object.values(restaurantBreakdown).map((r) => ({
          restaurant: r.restaurant,
          outlet: r.outlet,
          orderCount: r.orderCount,
          revenue: Math.round(r.revenue),
        })),
        topSellingItems: topItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          revenue: Math.round(item.revenue),
        })),
        recentOrders: orders.slice(0, 5).map((order) => {
          const customerName = [order.customer.firstName, order.customer.lastName]
            .filter(Boolean)
            .join(' ') || 'Customer';
          return {
            id: order.id,
            customer: customerName,
            outlet: order.outlet.name,
            total: Math.round(Number(order.total)),
            status: order.status,
            paymentMethod: order.payment?.method,
            createdAt: order.createdAt,
          };
        }),
        generatedAt: new Date().toISOString(),
      };

      this.logger.log(`\n📊 Daily Sales Report for ${report.date}:`);
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.log(`Summary:`);
      this.logger.log(`  Total Revenue: ₹${report.summary.totalRevenue}`);
      this.logger.log(`  Total Orders: ${report.summary.totalOrders}`);
      this.logger.log(`  Avg Order Value: ₹${report.summary.avgOrderValue}`);
      this.logger.log(`  New Customers: ${report.summary.newCustomers}`);
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.log(`Payment Breakdown:`);
      this.logger.log(`  Online: ${report.paymentBreakdown.online.count} orders (₹${report.paymentBreakdown.online.revenue})`);
      this.logger.log(`  Cash: ${report.paymentBreakdown.cash.count} orders (₹${report.paymentBreakdown.cash.revenue})`);
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.log(`Top Selling Items:`);
      report.topSellingItems.forEach((item, index) => {
        this.logger.log(`  ${index + 1}. ${item.name}: ${item.quantity} sold (₹${item.revenue})`);
      });
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.log(`Restaurant Breakdown:`);
      report.restaurantBreakdown.forEach((r) => {
        this.logger.log(`  ${r.restaurant} - ${r.outlet}: ${r.orderCount} orders (₹${r.revenue})`);
      });
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Send email to super admins
      await this.emailService.sendDailySalesReport(report);
      this.logger.log('✅ Daily sales report sent successfully');

      return report;
    } catch (error) {
      this.logger.error('Failed to generate daily sales report', error);
      throw error;
    }
  }
}
