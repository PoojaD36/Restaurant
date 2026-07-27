import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '../../events/interfaces/event-payloads.interface';
import { OrderStatus } from '../../database/generated/prisma/enums';

@Injectable()
export class OrderCleanupScheduler {
  private readonly logger = new Logger(OrderCleanupScheduler.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async cancelStaleOrders() {
    this.logger.log('⏰ Checking for stale pending orders...');

    try {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      // Find stale pending orders (single query, no N+1)
      const staleOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          createdAt: {
            lt: thirtyMinutesAgo,
          },
        },
        select: {
          id: true,
          customerId: true,
          outletId: true,
          total: true,
          outlet: {
            select: {
              restaurantId: true,
            },
          },
        },
      });

      if (staleOrders.length === 0) {
        this.logger.log('No stale orders found');
        return;
      }

      // Batch update all stale orders (single query)
      const cancellationResult = await this.prisma.order.updateMany({
        where: {
          id: { in: staleOrders.map((o) => o.id) },
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      this.logger.log(`✅ Cancelled ${cancellationResult.count} stale orders`);

      // Emit events for notifications (non-blocking)
      for (const order of staleOrders) {
        this.eventEmitter.emit(
          'order.cancelled',
          {
            orderId: order.id,
            customerId: order.customerId,
            outletId: order.outletId,
            restaurantId: order.outlet.restaurantId,
            cancellationReason:
              'Auto-cancelled: Order not confirmed within 30 minutes',
            total: Number(order.total),
            timestamp: new Date(),
          } as OrderCancelledEvent,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cancel stale orders', error);
    }
  }
}
