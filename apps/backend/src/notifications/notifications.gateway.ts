import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

/**
 * WebSocket Gateway for real-time order notifications
 *
 * Features:
 * - Restaurant-specific rooms (restaurant:1, restaurant:2, etc.)
 * - Customer-specific rooms (customer:1, customer:2, etc.)
 * - User authentication via JWT
 * - Real-time order notifications (created, updated, cancelled)
 *
 * Events:
 * - subscribe:restaurant - Subscribe to restaurant notifications
 * - unsubscribe:restaurant - Unsubscribe from restaurant notifications
 * - order.created - New order notification (to restaurant)
 * - order.updated - Order status update notification (to restaurant)
 * - order.cancelled - Order cancellation notification (to restaurant)
 * - order.status.updated - Order status update notification (to customer)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly adminJwtSecret: string;
  private readonly customerJwtSecret: string;

  // Store user ID to socket ID mapping
  private userSocketMap = new Map<number, string[]>();
  // Store user's restaurant subscriptions
  private userRestaurants = new Map<number, Set<number>>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.adminJwtSecret = this.configService.get<string>('JWT_SECRET') || 'restaurant-secret-key-change-in-production';
    this.customerJwtSecret = this.configService.get<string>('CUSTOMER_JWT_SECRET') || 'restaurant-customer-secret-key-change-in-production';
  }

  /**
   * Handle new WebSocket connection
   * Validates JWT token and extracts user information
   * Supports both admin and customer JWT tokens
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      // Verify JWT token - try admin secret first, then customer secret
      let payload: any;
      let tokenType: 'admin' | 'customer' | null = null;

      try {
        // Try admin JWT secret first
        payload = this.verifyToken(token, this.adminJwtSecret);
        tokenType = 'admin';
      } catch (adminError) {
        try {
          // Try customer JWT secret
          payload = this.verifyToken(token, this.customerJwtSecret);
          tokenType = 'customer';
        } catch (customerError) {
          this.logger.error(
            `JWT verification failed for socket ${client.id}: ` +
            `Admin: ${adminError instanceof Error ? adminError.message : 'Unknown error'}, ` +
            `Customer: ${customerError instanceof Error ? customerError.message : 'Unknown error'}`,
          );
          client.emit('error', { message: 'Authentication failed: Invalid token' });
          client.disconnect();
          return;
        }
      }

      // Extract user ID based on token type
      let userId: number;
      let role: string | undefined;

      if (tokenType === 'admin') {
        userId = payload.sub || payload.userId;
        role = payload.role;
      } else {
        // Customer token - check both 'sub' and 'customerId' for compatibility
        userId = payload.sub || payload.customerId;
        role = undefined;
      }

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token payload for socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed: Invalid token payload' });
        client.disconnect();
        return;
      }

      this.logger.log(`${tokenType === 'customer' ? 'Customer' : 'User'} ${userId} ${role ? `(${role})` : ''} authenticated for socket ${client.id}`);

      // Store socket mapping
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }
      this.userSocketMap.get(userId)!.push(client.id);

      // Get user's restaurant subscriptions (for admin/manager roles)
      if (role) {
        // Check if user is a delivery agent
        if (role === 'DELIVERY_AGENT') {
          // Subscribe delivery agent to their personal room for order assignments
          const roomName = `delivery-agent:${userId}`;
          client.join(roomName);
          this.logger.log(`Delivery Agent ${userId} connected with socket ${client.id} and joined ${roomName}`);
        } else {
          // Admin/Manager - subscribe to restaurant rooms
          const userRestaurants = await this.getUserRestaurants(userId, role);
          this.userRestaurants.set(userId, userRestaurants);

          // Auto-subscribe to user's restaurants
          for (const restaurantId of userRestaurants) {
            const roomName = `restaurant:${restaurantId}`;
            client.join(roomName);
            this.logger.debug(`User ${userId} auto-subscribed to ${roomName}`);
          }

          this.logger.log(
            `User ${userId} (${payload.role}) connected with socket ${client.id}. ` +
            `Subscribed to ${userRestaurants.size} restaurants.`,
          );
        }
      } else {
        // Customer - subscribe to their personal room for order updates
        const roomName = `customer:${userId}`;
        client.join(roomName);
        this.logger.log(`Customer ${userId} connected with socket ${client.id} and joined ${roomName}`);
      }

      // Send connection acknowledgment
      client.emit('connected', {
        success: true,
        message: 'Connected to notifications',
        userId,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: Socket) {
    // Clean up socket mappings
    for (const [userId, sockets] of this.userSocketMap.entries()) {
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSocketMap.delete(userId);
          this.userRestaurants.delete(userId);
        }
        break;
      }
    }
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  /**
   * Subscribe to restaurant notifications
   * Event: 'subscribe:restaurant'
   * Payload: { restaurantId: number }
   */
  @SubscribeMessage('subscribe:restaurant')
  async handleSubscribeRestaurant(
    @MessageBody() data: { restaurantId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { restaurantId } = data;
      const userId = this.getUserIdFromSocket(client);

      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify user has access to this restaurant
      const hasAccess = await this.verifyRestaurantAccess(userId, restaurantId);
      if (!hasAccess) {
        client.emit('error', { message: 'No access to this restaurant' });
        return;
      }

      const roomName = `restaurant:${restaurantId}`;
      client.join(roomName);

      // Update user's restaurant subscriptions
      const restaurants = this.userRestaurants.get(userId) || new Set();
      restaurants.add(restaurantId);
      this.userRestaurants.set(userId, restaurants);

      this.logger.log(`User ${userId} subscribed to ${roomName}`);
      client.emit('subscribed', { restaurantId });
    } catch (error) {
      this.logger.error(`Subscribe error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      client.emit('error', { message: 'Failed to subscribe' });
    }
  }

  /**
   * Unsubscribe from restaurant notifications
   * Event: 'unsubscribe:restaurant'
   * Payload: { restaurantId: number }
   */
  @SubscribeMessage('unsubscribe:restaurant')
  handleUnsubscribeRestaurant(
    @MessageBody() data: { restaurantId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { restaurantId } = data;
      const roomName = `restaurant:${restaurantId}`;
      client.leave(roomName);

      const userId = this.getUserIdFromSocket(client);
      if (userId) {
        const restaurants = this.userRestaurants.get(userId);
        if (restaurants) {
          restaurants.delete(restaurantId);
        }
      }

      this.logger.log(`Socket ${client.id} unsubscribed from ${roomName}`);
      client.emit('unsubscribed', { restaurantId });
    } catch (error) {
      this.logger.error(`Unsubscribe error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Notify restaurant of new order
   * Called by OrderService when an order is created
   */
  notifyOrderCreated(outletId: number, orderData: any) {
    // Get outlet's restaurant ID
    this.prisma.outlet
      .findUnique({
        where: { id: outletId },
        select: { restaurantId: true },
      })
      .then(outlet => {
        if (outlet) {
          const roomName = `restaurant:${outlet.restaurantId}`;
          this.server.to(roomName).emit('order.created', orderData);
          this.logger.log(
            `Order #${orderData.orderId} notification sent to ${roomName}`,
          );
        }
      })
      .catch(error => {
        this.logger.error(`Failed to notify order created: ${error.message}`);
      });
  }

  /**
   * Notify restaurant of order status update
   * Called by OrderService when an order status changes
   */
  notifyOrderUpdated(outletId: number, orderData: any) {
    this.prisma.outlet
      .findUnique({
        where: { id: outletId },
        select: { restaurantId: true },
      })
      .then(outlet => {
        if (outlet) {
          const roomName = `restaurant:${outlet.restaurantId}`;
          this.server.to(roomName).emit('order.updated', orderData);
          this.logger.log(
            `Order #${orderData.orderId} update notification sent to ${roomName}`,
          );
        }
      })
      .catch(error => {
        this.logger.error(`Failed to notify order updated: ${error.message}`);
      });
  }

  /**
   * Notify restaurant of order cancellation
   * Called by OrderService when an order is cancelled
   */
  notifyOrderCancelled(outletId: number, orderData: any) {
    this.prisma.outlet
      .findUnique({
        where: { id: outletId },
        select: { restaurantId: true },
      })
      .then(outlet => {
        if (outlet) {
          const roomName = `restaurant:${outlet.restaurantId}`;
          this.server.to(roomName).emit('order.cancelled', orderData);
          this.logger.log(
            `Order #${orderData.orderId} cancellation sent to ${roomName}`,
          );
        }
      })
      .catch(error => {
        this.logger.error(`Failed to notify order cancelled: ${error.message}`);
      });
  }

  /**
   * Notify customer of order status update
   * Called by OrderService when restaurant admin/manager updates order status
   */
  notifyCustomerOrderUpdated(customerId: number, orderData: any) {
    const roomName = `customer:${customerId}`;
    this.server.to(roomName).emit('order.status.updated', orderData);
    this.logger.log(
      `Order #${orderData.orderId} status update sent to customer ${customerId}`,
    );
  }

  /**
   * Notify delivery agent of new order assignment
   * Called by OrderService when a delivery agent is assigned to an order
   */
  notifyDeliveryAgentOrderAssigned(deliveryAgentId: number, orderData: any) {
    const roomName = `delivery-agent:${deliveryAgentId}`;
    this.server.to(roomName).emit('order.assigned', orderData);
    this.logger.log(
      `Order #${orderData.orderId} assignment notification sent to delivery agent ${deliveryAgentId}`,
    );
  }

  /**
   * Notify restaurant when chef starts preparing order
   * Called by OrderService when a chef claims an order
   */
  notifyOrderPreparing(outletId: number, orderData: any) {
    this.prisma.outlet
      .findUnique({
        where: { id: outletId },
        select: { restaurantId: true },
      })
      .then(outlet => {
        if (outlet) {
          const roomName = `restaurant:${outlet.restaurantId}`;
          this.server.to(roomName).emit('order.preparing', orderData);
          this.logger.log(
            `Order #${orderData.orderId} preparing notification sent to ${roomName} (Chef: ${orderData.chefName})`,
          );
        }
      })
      .catch(error => {
        this.logger.error(`Failed to notify order preparing: ${error.message}`);
      });
  }

  /**
   * Notify restaurant when order is ready for delivery assignment
   * Called by OrderService when a chef marks order as ready
   */
  notifyOrderReady(outletId: number, orderData: any) {
    this.prisma.outlet
      .findUnique({
        where: { id: outletId },
        select: { restaurantId: true },
      })
      .then(outlet => {
        if (outlet) {
          const roomName = `restaurant:${outlet.restaurantId}`;
          this.server.to(roomName).emit('order.ready', orderData);
          this.logger.log(
            `Order #${orderData.orderId} ready notification sent to ${roomName}`,
          );
        }
      })
      .catch(error => {
        this.logger.error(`Failed to notify order ready: ${error.message}`);
      });
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.auth.token;
    if (authHeader) {
      return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    // Also check query parameter for fallback
    const tokenQuery = client.handshake.query.token as string;
    return tokenQuery || null;
  }

  /**
   * Verify JWT token with a specific secret
   */
  private verifyToken(token: string, secret: string): any {
    const { verify } = require('jsonwebtoken');
    return verify(token, secret);
  }

  /**
   * Get user ID from socket
   */
  private getUserIdFromSocket(client: Socket): number | null {
    for (const [userId, sockets] of this.userSocketMap.entries()) {
      if (sockets.includes(client.id)) {
        return userId;
      }
    }
    return null;
  }

  /**
   * Get user's accessible restaurants
   */
  private async getUserRestaurants(
    userId: number,
    role: string,
  ): Promise<Set<number>> {
    const restaurants = new Set<number>();

    try {
      // Get restaurants where user has access
      const userRestaurantData = await this.prisma.restaurantUser.findMany({
        where: { userId },
        select: { restaurantId: true },
      });

      userRestaurantData.forEach(ur => restaurants.add(ur.restaurantId));

      // Also get restaurants through outlet access
      const userOutletData = await this.prisma.outletUser.findMany({
        where: { userId },
        include: {
          outlet: {
            select: { restaurantId: true },
          },
        },
      });

      userOutletData.forEach(uo => {
        if (uo.outlet) {
          restaurants.add(uo.outlet.restaurantId);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get user restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return restaurants;
  }

  /**
   * Verify user has access to restaurant
   */
  private async verifyRestaurantAccess(
    userId: number,
    restaurantId: number,
  ): Promise<boolean> {
    try {
      // Check direct restaurant access
      const directAccess = await this.prisma.restaurantUser.findFirst({
        where: { userId, restaurantId },
      });

      if (directAccess) {
        return true;
      }

      // Check access through outlets
      const outletAccess = await this.prisma.outletUser.findFirst({
        where: {
          userId,
          outlet: { restaurantId },
        },
      });

      return !!outletAccess;
    } catch (error) {
      this.logger.error(`Failed to verify restaurant access: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}
