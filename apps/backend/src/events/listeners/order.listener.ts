import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import type { DeliveryAgentAssignedEvent, OrderCancelledEvent, OrderCreatedEvent, OrderDeliveredEvent, OrderPaidEvent, OrderPreparingEvent, OrderReadyEvent, OrderStatusUpdatedEvent } from '../interfaces/event-payloads.interface';


@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(private notificationsGateway: NotificationsGateway) {}

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent) {
    this.logger.log(`📦 Order created event received: #${payload.orderId}`);

    try {
      // 1. Notify restaurant via WebSocket (existing behavior)
      await this.notificationsGateway.notifyOrderCreated(payload.outletId, {
        orderId: payload.orderId,
        status: payload.status,
        total: payload.total,
        items: payload.items,
        deliveryAddress: payload.deliveryAddress,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        specialInstructions: payload.specialInstructions,
        createdAt: payload.createdAt,
      });

      // 2. TODO: Send SMS to customer (future enhancement)
      // await this.smsService.sendOrderConfirmation(payload);

      // 3. TODO: Send email receipt (future enhancement)
      // await this.emailService.sendOrderConfirmation(payload);

      // 4. TODO: Track in analytics
      // await this.analyticsService.trackOrderCreated(payload);

      this.logger.log(`Order created event processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process order.created event`, error);
    }
  }

  @OnEvent('order.status.updated')
  async handleOrderStatusUpdated(payload: OrderStatusUpdatedEvent) {
    this.logger.log(
      `📤 Order status updated: #${payload.orderId} ${payload.previousStatus} → ${payload.newStatus}`,
    );

    try {
      // Get user-friendly status message
      const message = this.getStatusMessage(payload.newStatus, payload.orderId);

      // 1. Notify customer via WebSocket
      await this.notificationsGateway.notifyCustomerOrderUpdated(payload.customerId, {
        orderId: payload.orderId,
        status: payload.newStatus,
        previousStatus: payload.previousStatus,
        outletName: payload.outletName,
        total: payload.total,
        message,
        timestamp: payload.timestamp,
      });

      // 2. TODO: Send push notification for mobile app
      // await this.pushService.sendNotification(payload.customerId, message);

      this.logger.log(`Order status updated event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.status.updated event', error);
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: OrderCancelledEvent) {
    this.logger.log(`❌ Order cancelled event received: #${payload.orderId}`);

    try {
      // 1. Notify restaurant via WebSocket
      await this.notificationsGateway.notifyOrderCancelled(payload.outletId, {
        orderId: payload.orderId,
        reason: payload.cancellationReason || 'Customer cancelled',
        total: payload.total,
        timestamp: payload.timestamp,
      });

      // 2. Notify customer via WebSocket
      await this.notificationsGateway.notifyCustomerOrderUpdated(payload.customerId, {
        orderId: payload.orderId,
        status: 'CANCELLED',
        message: `Your order #${payload.orderId} has been cancelled.`,
        timestamp: payload.timestamp,
      });

      this.logger.log(`Order cancelled event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.cancelled event', error);
    }
  }

  @OnEvent('order.paid')
  async handleOrderPaid(payload: OrderPaidEvent) {
    this.logger.log(`💰 Order paid event received: #${payload.orderId}`);

    try {
      // 1. Notify restaurant to start preparing
      await this.notificationsGateway.notifyOrderUpdated(payload.outletId, {
        orderId: payload.orderId,
        paymentStatus: payload.status,
        paymentMethod: payload.method,
      });

      // 2. TODO: Send payment receipt via email
      // await this.emailService.sendPaymentReceipt(payload);

      this.logger.log(`Order paid event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.paid event', error);
    }
  }

  @OnEvent('delivery.agent.assigned')
  async handleDeliveryAgentAssigned(payload: DeliveryAgentAssignedEvent) {
    this.logger.log(`🚗 Delivery agent assigned event: #${payload.orderId}`);

    try {
      // 1. Notify delivery agent via WebSocket
      await this.notificationsGateway.notifyDeliveryAgentOrderAssigned(
        payload.deliveryAgentId,
        {
          orderId: payload.orderId,
          outletName: payload.outletName,
          customerPhone: payload.customerPhone,
          customerAddress: payload.customerAddress,
          total: payload.total,
          assignedAt: payload.assignedAt,
        },
      );

      // 2. Notify customer that delivery agent is assigned
      await this.notificationsGateway.notifyCustomerOrderUpdated(payload.customerId, {
        orderId: payload.orderId,
        status: 'OUT_FOR_DELIVERY',
        message: `Your order is out for delivery with ${payload.deliveryAgentName}`,
        timestamp: payload.assignedAt,
      });

      this.logger.log(`Delivery agent assigned event processed`);
    } catch (error) {
      this.logger.error('Failed to process delivery.agent.assigned event', error);
    }
  }

  @OnEvent('order.preparing')
  async handleOrderPreparing(payload: OrderPreparingEvent) {
    this.logger.log(`👨‍🍳 Order preparing event: #${payload.orderId}`);

    try {
      await this.notificationsGateway.notifyOrderPreparing(payload.outletId, {
        orderId: payload.orderId,
        chefName: payload.chefName,
        startedAt: payload.startedAt,
      });

      this.logger.log(`Order preparing event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.preparing event', error);
    }
  }

  @OnEvent('order.ready')
  async handleOrderReady(payload: OrderReadyEvent) {
    this.logger.log(`Order ready event: #${payload.orderId}`);

    try {
      // 1. Notify restaurant
      await this.notificationsGateway.notifyOrderReady(payload.outletId, {
        orderId: payload.orderId,
        chefName: payload.chefName,
        completedAt: payload.completedAt,
      });

      // 2. Notify customer
      await this.notificationsGateway.notifyCustomerOrderUpdated(payload.customerId, {
        orderId: payload.orderId,
        status: 'READY',
        message: `Your order is ready and waiting for delivery partner!`,
        timestamp: payload.completedAt,
      });

      this.logger.log(`Order ready event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.ready event', error);
    }
  }

  @OnEvent('order.delivered')
  async handleOrderDelivered(payload: OrderDeliveredEvent) {
    this.logger.log(`🎉 Order delivered event: #${payload.orderId}`);

    try {
      // Notify customer
      await this.notificationsGateway.notifyCustomerOrderUpdated(payload.customerId, {
        orderId: payload.orderId,
        status: 'DELIVERED',
        message: `Your order has been delivered. Enjoy your meal!`,
        timestamp: payload.deliveredAt,
      });

      this.logger.log(`Order delivered event processed`);
    } catch (error) {
      this.logger.error('Failed to process order.delivered event', error);
    }
  }

  private getStatusMessage(status: string, orderId: number): string {
    const messages: Record<string, string> = {
      CONFIRMED: `Your order #${orderId} has been confirmed!`,
      PREPARING: `Your order #${orderId} is being prepared. It won't be long!`,
      READY: `Your order #${orderId} is ready and waiting for delivery partner!`,
      OUT_FOR_DELIVERY: `Your order #${orderId} is out for delivery!`,
      DELIVERED: `Your order #${orderId} has been delivered. Enjoy your meal!`,
      CANCELLED: `Your order #${orderId} has been cancelled.`,
    };
    return messages[status] || `Order #${orderId} status updated to ${status}`;
  }
}