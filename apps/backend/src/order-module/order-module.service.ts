import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto, OrderItemDto, AssignDeliveryAgentDto, CollectPaymentDto } from './dto';
import { OrderStatus, OutletStatus, MenuItemStatus, UserRole } from 'src/database/generated/prisma/enums';
import { PaginationDto, PaginationMeta, ApiResponse, PaginatedResponse } from '../common';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrderModuleService {
  private readonly logger = new Logger(OrderModuleService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create order from cart items
   */
  async createOrder(customerId: number, dto: CreateOrderDto): Promise<ApiResponse<any>> {
    try {
      const { outletId, addressId, items, specialInstructions } = dto;

      // Validate outlet exists and is active
      const outlet = await this.prisma.outlet.findFirst({
        where: { id: outletId, status: OutletStatus.ACTIVE },
      });

      if (!outlet) {
        throw new NotFoundException('Outlet not found or inactive');
      }

      // Validate customer address exists
      const address = await this.prisma.customerAddress.findFirst({
        where: { id: addressId, customerId },
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      // Validate items and calculate subtotal
      if (!items || items.length === 0) {
        throw new BadRequestException('Order must contain at least one item');
      }

      let subtotal = 0;
      for (const item of items) {
        const menuItem = await this.prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
        });

        if (!menuItem) {
          throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
        }

        if (menuItem.status !== MenuItemStatus.AVAILABLE) {
          throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
        }

        // Calculate item total with modifiers
        let itemTotal = Number(item.price) * item.quantity;
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifier of item.modifiers) {
            for (const option of modifier.selectedOptions) {
              itemTotal += Number(option.priceAdjustment) * item.quantity;
            }
          }
        }
        subtotal += itemTotal;
      }

      // Calculate delivery fee (flat rate for now, can be enhanced with distance calculation)
      const deliveryFee = 30; // ₹30 flat delivery fee

      // Calculate total
      const total = subtotal + deliveryFee;

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          customerId,
          outletId,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          total,
          // Delivery address snapshot
          deliveryAddressLabel: address.label,
          deliveryName: address.name,
          deliveryPhone: address.phone,
          deliveryAddressLine1: address.addressLine1,
          deliveryAddressLine2: address.addressLine2 || null,
          deliveryCity: address.city,
          deliveryState: address.state,
          deliveryCountry: address.country,
          deliveryPostalCode: address.postalCode,
          deliveryLatitude: address.latitude,
          deliveryLongitude: address.longitude,
          specialInstructions: specialInstructions || null,
          items: {
            create: items.map((item: OrderItemDto) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              modifiers: item.modifiers as unknown as Prisma.InputJsonValue,
            })),
          },
        },
        include: {
          items: true,
          outlet: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
            },
          },
        },
      });

      // Fetch order items separately to ensure proper typing
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      // Create payment record if payment method is provided
      let paymentData: {
        id: number;
        amount: number;
        method: string;
        status: string;
        transactionId: string | null;
      } | null = null;

      if (dto.paymentMethod) {
        const paymentMethod = dto.paymentMethod as any;
        const paymentStatus = dto.paymentMethod === 'CASH'
          ? 'PENDING'  // COD - payment pending until delivery
          : 'COMPLETED'; // Online payment - already paid

        const paymentRecord = await this.prisma.payment.create({
          data: {
            orderId: order.id,
            amount: total,
            method: paymentMethod,
            status: paymentStatus,
            transactionId: dto.razorpayPaymentId || null,
          },
        });

        paymentData = {
          id: paymentRecord.id,
          amount: Number(paymentRecord.amount),
          method: paymentRecord.method,
          status: paymentRecord.status,
          transactionId: paymentRecord.transactionId,
        };

        this.logger.log(`Payment record created: ${paymentRecord.id} for order: ${order.id}, method: ${paymentMethod}, status: ${paymentStatus}`);
      }

      this.logger.log(`Order created: ${order.id} for customer: ${customerId}`);

      // Emit WebSocket notification to restaurant
      this.notificationsGateway.notifyOrderCreated(outletId, {
        orderId: order.id,
        outletId: order.outletId,
        outletName: outlet.name,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          ...item,
          price: Number(item.price),
        })),
        deliveryAddress: {
          name: address.name,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
        },
        specialInstructions: order.specialInstructions,
      });

      return {
        success: true,
        message: 'Order placed successfully',
        data: {
          orderId: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          payment: paymentData,
          items: orderItems.map(item => ({
            ...item,
            price: Number(item.price),
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Log detailed error for debugging
      this.logger.error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      // Return meaningful error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get customer's orders with pagination
   */
  async getCustomerOrders(customerId: number, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit, skip } = dto;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { customerId },
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                addressLine1: true,
                city: true,
              },
            },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where: { customerId } }),
      ]);

      const pagination = new PaginationMeta(total, page, limit);

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: orders.map(order => ({
          id: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
          specialInstructions: order.specialInstructions,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          outlet: order.outlet,
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
          })),
        })),
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get customer orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve orders';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number, customerId: number): Promise<ApiResponse<any>> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, customerId },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
              phone: true,
            },
          },
          items: true,
          payment: true,
          deliveryAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: {
          id: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
          specialInstructions: order.specialInstructions,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          deliveryAddress: {
            label: order.deliveryAddressLabel,
            name: order.deliveryName,
            phone: order.deliveryPhone,
            addressLine1: order.deliveryAddressLine1,
            addressLine2: order.deliveryAddressLine2,
            city: order.deliveryCity,
            state: order.deliveryState,
            country: order.deliveryCountry,
            postalCode: order.deliveryPostalCode,
          },
          createdAt: order.createdAt,
          pickedUpAt: order.pickedUpAt,
          deliveredAt: order.deliveredAt,
          outlet: order.outlet,
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
          })),
          payment: order.payment ? {
            ...order.payment,
            amount: Number(order.payment.amount),
          } : null,
          deliveryAgent: order.deliveryAgent ? {
            id: order.deliveryAgent.id,
            name: `${order.deliveryAgent.firstName} ${order.deliveryAgent.lastName || ''}`.trim(),
            phone: order.deliveryAgent.phone,
          } : null,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve order';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get orders for a specific outlet (for restaurant admin/manager)
   */
  async getOutletOrders(
    outletId: number,
    dto: PaginationDto,
    status?: OrderStatus,
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit, skip } = dto;

      const where: any = { outletId };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                addressLine1: true,
                city: true,
              },
            },
            items: true,
            payment: true,
            deliveryAgent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            chef: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      const pagination = new PaginationMeta(total, page, limit);

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: orders.map(order => ({
          id: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
          specialInstructions: order.specialInstructions,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          deliveryName: order.deliveryName,
          deliveryPhone: order.deliveryPhone,
          deliveryAddressLine1: order.deliveryAddressLine1,
          deliveryCity: order.deliveryCity,
          outlet: order.outlet,
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
          })),
          payment: order.payment ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          } : null,
          deliveryAgent: order.deliveryAgent ? {
            id: order.deliveryAgent.id,
            name: `${order.deliveryAgent.firstName} ${order.deliveryAgent.lastName || ''}`.trim(),
            phone: order.deliveryAgent.phone,
          } : null,
          chef: order.chef ? {
            id: order.chef.id,
            name: `${order.chef.firstName} ${order.chef.lastName || ''}`.trim(),
          } : null,
          startedAt: order.startedAt,
          completedAt: order.completedAt,
        })),
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get outlet orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve orders';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Update order status (for restaurant admin/manager)
   * Notifies the customer when status changes
   */
  async updateOrderStatus(orderId: number, status: OrderStatus, userId: number): Promise<ApiResponse<any>> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, customerId: true, outletId: true, pickedUpAt: true, deliveryAgentId: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        PREPARING: [OrderStatus.READY], // Removed OUT_FOR_DELIVERY - must assign agent first
        READY: [OrderStatus.OUT_FOR_DELIVERY],
        OUT_FOR_DELIVERY: [], // Restaurant cannot mark as DELIVERED - only delivery agent can
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowedStatuses = validTransitions[order.status];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${status}. Valid transitions: ${allowedStatuses.join(', ')}`,
        );
      }

      // Require delivery agent assignment before OUT_FOR_DELIVERY status
      if (status === OrderStatus.OUT_FOR_DELIVERY && !order.deliveryAgentId) {
        throw new BadRequestException('Cannot mark order as "Out for Delivery" without assigning a delivery agent first. Please assign a delivery agent to this order.');
      }

      // Update order status
      const updateData: any = { status };

      // Set timestamps based on status
      if (status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
      } else if (status === OrderStatus.OUT_FOR_DELIVERY && !order.pickedUpAt) {
        updateData.pickedUpAt = new Date();
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
        select: {
          id: true,
          status: true,
          customerId: true,
          outletId: true,
          total: true,
          createdAt: true,
          deliveredAt: true,
        },
      });

      this.logger.log(`Order ${orderId} status updated from ${order.status} to ${status} by user ${userId}`);

      // Emit WebSocket notification ONLY to customer (not to restaurant)
      this.notificationsGateway.notifyCustomerOrderUpdated(order.customerId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        previousStatus: order.status,
        total: Number(updatedOrder.total),
        deliveredAt: updatedOrder.deliveredAt,
      });

      return {
        success: true,
        message: 'Order status updated successfully',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          previousStatus: order.status,
          deliveredAt: updatedOrder.deliveredAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number, customerId: number): Promise<ApiResponse<any>> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, customerId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new ForbiddenException('Only pending orders can be cancelled');
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      this.logger.log(`Order cancelled: ${orderId} by customer: ${customerId}`);

      // Emit WebSocket notification to restaurant
      this.notificationsGateway.notifyOrderCancelled(order.outletId, {
        orderId: updatedOrder.id,
        outletId: order.outletId,
        status: updatedOrder.status,
        cancelledAt: new Date(),
      });

      return {
        success: true,
        message: 'Order cancelled successfully',
        data: { orderId: updatedOrder.id, status: updatedOrder.status },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Assign delivery agent to order
   */
  async assignDeliveryAgent(orderId: number, dto: AssignDeliveryAgentDto): Promise<ApiResponse<any>> {
    try {
      // Verify order exists and is in appropriate status
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          outlet: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Only allow assignment for orders that are ready or out for delivery
      if (order.status !== OrderStatus.READY && order.status !== OrderStatus.OUT_FOR_DELIVERY) {
        throw new BadRequestException('Can only assign delivery agent to orders that are ready or out for delivery');
      }

      // Verify delivery agent exists and has DELIVERY_AGENT role
      const deliveryAgent = await this.prisma.user.findFirst({
        where: {
          id: dto.deliveryAgentId,
          role: UserRole.DELIVERY_AGENT,
          status: 'ACTIVE',
        },
      });

      if (!deliveryAgent) {
        throw new NotFoundException('Delivery agent not found or inactive');
      }

      // Update order with delivery agent
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryAgentId: dto.deliveryAgentId,
          // If order is READY, automatically move to OUT_FOR_DELIVERY when agent is assigned
          status: order.status === OrderStatus.READY ? OrderStatus.OUT_FOR_DELIVERY : order.status,
        },
        select: {
          id: true,
          status: true,
          deliveryAgentId: true,
          customerId: true,
        },
      });

      this.logger.log(`Delivery agent ${dto.deliveryAgentId} assigned to order ${orderId}`);

      // Notify customer about delivery agent assignment
      this.notificationsGateway.notifyCustomerOrderUpdated(order.customerId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        previousStatus: order.status,
        total: Number(order.total),
        deliveryAgentAssigned: true,
      });

      // Notify delivery agent about new assignment
      this.notificationsGateway.notifyDeliveryAgentOrderAssigned(dto.deliveryAgentId, {
        orderId: updatedOrder.id,
        outletId: order.outletId,
        outletName: order.outlet.name,
        status: updatedOrder.status,
        total: Number(order.total),
        customerName: order.deliveryName,
        customerPhone: order.deliveryPhone,
        deliveryAddress: {
          addressLine1: order.deliveryAddressLine1,
          addressLine2: order.deliveryAddressLine2,
          city: order.deliveryCity,
          state: order.deliveryState,
          postalCode: order.deliveryPostalCode,
          latitude: Number(order.deliveryLatitude),
          longitude: Number(order.deliveryLongitude),
        },
      });

      return {
        success: true,
        message: 'Delivery agent assigned successfully',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          deliveryAgentId: updatedOrder.deliveryAgentId,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to assign delivery agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign delivery agent';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get orders for a delivery agent
   */
  async getDeliveryAgentOrders(deliveryAgentId: number, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit, skip } = dto;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: {
            deliveryAgentId,
            status: {
              in: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
            },
          },
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                addressLine1: true,
                city: true,
                phone: true,
              },
            },
            items: true,
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({
          where: {
            deliveryAgentId,
            status: {
              in: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
            },
          },
        }),
      ]);

      const pagination = new PaginationMeta(total, page, limit);

      return {
        success: true,
        message: 'Delivery agent orders retrieved successfully',
        data: orders.map(order => ({
          id: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
          specialInstructions: order.specialInstructions,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          deliveryName: order.deliveryName,
          deliveryPhone: order.deliveryPhone,
          deliveryAddressLine1: order.deliveryAddressLine1,
          deliveryAddressLine2: order.deliveryAddressLine2,
          deliveryCity: order.deliveryCity,
          deliveryState: order.deliveryState,
          deliveryCountry: order.deliveryCountry,
          deliveryPostalCode: order.deliveryPostalCode,
          deliveryLatitude: Number(order.deliveryLatitude),
          deliveryLongitude: Number(order.deliveryLongitude),
          outlet: order.outlet,
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
          })),
          payment: order.payment ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          } : null,
        })),
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get delivery agent orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve delivery agent orders';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Update delivery agent location (for tracking)
   */
  async updateDeliveryLocation(orderId: number, deliveryAgentId: number, location: { latitude: number; longitude: number }): Promise<ApiResponse<any>> {
    try {
      // Verify order is assigned to this delivery agent
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          deliveryAgentId,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found or not assigned to this delivery agent');
      }

      // For now, just return success
      // In production, you would store this in a separate location tracking table
      // or use a real-time location tracking service

      this.logger.log(`Location updated for order ${orderId} by delivery agent ${deliveryAgentId}`);

      return {
        success: true,
        message: 'Location updated successfully',
        data: {
          orderId,
          latitude: location.latitude,
          longitude: location.longitude,
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update delivery location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery location';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Mark order as delivered (delivery agent only)
   * Only the assigned delivery agent can mark the order as delivered
   * For COD orders, payment details must be provided to complete the delivery
   */
  async markOrderAsDelivered(
    orderId: number,
    deliveryAgentId: number,
    collectPaymentDto?: CollectPaymentDto,
  ): Promise<ApiResponse<any>> {
    try {
      // Verify order is assigned to this delivery agent and is OUT_FOR_DELIVERY
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          deliveryAgentId,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
        select: {
          id: true,
          status: true,
          customerId: true,
          outletId: true,
          total: true,
          payment: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found, not assigned to you, or not yet out for delivery');
      }

      // Check payment status
      const isPendingPayment = order.payment && order.payment.status === 'PENDING';

      // If payment is pending (COD), payment details must be provided
      if (isPendingPayment && !collectPaymentDto) {
        throw new BadRequestException(
          'Payment is pending. Please collect payment from the customer before marking as delivered.',
        );
      }

      // If payment is pending and details are provided, update the payment record
      if (isPendingPayment && collectPaymentDto) {
        await this.prisma.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'COMPLETED',
            method: collectPaymentDto.paymentMethod,
            transactionId: collectPaymentDto.transactionId || null,
          },
        });

        this.logger.log(
          `Payment collected for order ${orderId}: ${collectPaymentDto.paymentMethod}${collectPaymentDto.transactionId ? ` (txn: ${collectPaymentDto.transactionId})` : ''}`,
        );
      }

      // Update order status to DELIVERED
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          customerId: true,
          deliveredAt: true,
        },
      });

      this.logger.log(`Order ${orderId} marked as DELIVERED by delivery agent ${deliveryAgentId}`);

      // Notify customer that order has been delivered
      this.notificationsGateway.notifyCustomerOrderUpdated(order.customerId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        previousStatus: order.status,
        total: Number(order.total),
        deliveredAt: updatedOrder.deliveredAt,
      });

      return {
        success: true,
        message: 'Order marked as delivered successfully',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          deliveredAt: updatedOrder.deliveredAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to mark order as delivered: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as delivered';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get orders for a chef
   * Returns CONFIRMED orders (pending claim) and PREPARING orders (assigned to this chef)
   */
  async getChefOrders(chefId: number, outletId?: number): Promise<ApiResponse<any>> {
    try {
      // Get chef's assigned outlets (if not provided)
      let chefOutletIds: number[] = [];

      if (outletId) {
        // Validate chef is assigned to this outlet
        const outletUser = await this.prisma.outletUser.findFirst({
          where: {
            outletId,
            userId: chefId,
          },
        });

        if (!outletUser) {
          throw new ForbiddenException('You are not assigned to this outlet');
        }

        chefOutletIds = [outletId];
      } else {
        // Get all outlets assigned to this chef
        const outletUsers = await this.prisma.outletUser.findMany({
          where: { userId: chefId },
          select: { outletId: true },
        });

        chefOutletIds = outletUsers.map((ou) => ou.outletId);

        if (chefOutletIds.length === 0) {
          throw new ForbiddenException('You are not assigned to any outlet');
        }
      }

      // Get CONFIRMED orders (not yet claimed) for chef's outlets
      const pendingOrders = await this.prisma.order.findMany({
        where: {
          outletId: { in: chefOutletIds },
          status: OrderStatus.CONFIRMED,
          chefId: null, // Not yet claimed
        },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'asc' }, // Oldest first
      });

      // Get PREPARING orders assigned to this chef
      const preparingOrders = await this.prisma.order.findMany({
        where: {
          outletId: { in: chefOutletIds },
          status: OrderStatus.PREPARING,
          chefId: chefId, // Assigned to this chef
        },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
            },
          },
          items: true,
        },
        orderBy: { startedAt: 'asc' }, // Longest preparing first
      });

      return {
        success: true,
        message: 'Chef orders retrieved successfully',
        data: {
          pending: pendingOrders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: Number(order.subtotal),
            deliveryFee: Number(order.deliveryFee),
            total: Number(order.total),
            specialInstructions: order.specialInstructions,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            createdAt: order.createdAt,
            deliveryName: order.deliveryName,
            deliveryPhone: order.deliveryPhone,
            deliveryAddressLine1: order.deliveryAddressLine1,
            deliveryCity: order.deliveryCity,
            outlet: order.outlet,
            items: order.items.map(item => ({
              ...item,
              price: Number(item.price),
            })),
          })),
          preparing: preparingOrders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: Number(order.subtotal),
            deliveryFee: Number(order.deliveryFee),
            total: Number(order.total),
            specialInstructions: order.specialInstructions,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            createdAt: order.createdAt,
            startedAt: order.startedAt,
            deliveryName: order.deliveryName,
            deliveryPhone: order.deliveryPhone,
            deliveryAddressLine1: order.deliveryAddressLine1,
            deliveryCity: order.deliveryCity,
            outlet: order.outlet,
            items: order.items.map(item => ({
              ...item,
              price: Number(item.price),
            })),
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to get chef orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve chef orders';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Claim an order (chef only)
   * Assigns the order to the chef and updates status to PREPARING
   */
  async claimOrder(orderId: number, chefId: number): Promise<ApiResponse<any>> {
    try {
      // Verify order exists and is CONFIRMED
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          outletId: true,
          chefId: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.CONFIRMED) {
        throw new BadRequestException('Can only claim orders that are confirmed');
      }

      if (order.chefId !== null) {
        throw new BadRequestException('This order has already been claimed by another chef');
      }

      // Verify chef is assigned to this outlet
      const outletUser = await this.prisma.outletUser.findFirst({
        where: {
          outletId: order.outletId,
          userId: chefId,
        },
      });

      if (!outletUser) {
        throw new ForbiddenException('You are not assigned to this outlet');
      }

      // Get chef details for notification
      const chef = await this.prisma.user.findUnique({
        where: { id: chefId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      // Update order: assign chef and set to PREPARING
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          chefId: chefId,
          status: OrderStatus.PREPARING,
          startedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          outletId: true,
          chefId: true,
          startedAt: true,
        },
      });

      this.logger.log(`Order ${orderId} claimed by chef ${chefId}`);

      // Notify restaurant that order is being prepared
      this.notificationsGateway.notifyOrderPreparing(order.outletId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        chefId: updatedOrder.chefId,
        chefName: chef ? `${chef.firstName} ${chef.lastName || ''}`.trim() : 'Unknown',
        startedAt: updatedOrder.startedAt,
      });

      return {
        success: true,
        message: 'Order claimed successfully',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          chefId: updatedOrder.chefId,
          startedAt: updatedOrder.startedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to claim order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim order';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Mark order as ready (chef only)
   * Updates status to READY and sets completedAt timestamp
   */
  async markOrderReady(orderId: number, chefId: number): Promise<ApiResponse<any>> {
    try {
      // Verify order exists, is PREPARING, and is assigned to this chef
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          status: OrderStatus.PREPARING,
          chefId: chefId,
        },
        select: {
          id: true,
          status: true,
          outletId: true,
          customerId: true,
          total: true,
          chefId: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found, not being prepared by you, or not in PREPARING status');
      }

      // Update order to READY
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.READY,
          completedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          outletId: true,
          customerId: true,
          total: true,
          completedAt: true,
        },
      });

      this.logger.log(`Order ${orderId} marked as READY by chef ${chefId}`);

      // Notify restaurant that order is ready for delivery assignment
      this.notificationsGateway.notifyOrderReady(order.outletId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        chefId: order.chefId,
        completedAt: updatedOrder.completedAt,
        total: Number(updatedOrder.total),
      });

      // Notify customer that order is ready
      this.notificationsGateway.notifyCustomerOrderUpdated(order.customerId, {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        previousStatus: order.status,
        total: Number(updatedOrder.total),
      });

      return {
        success: true,
        message: 'Order marked as ready successfully',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          completedAt: updatedOrder.completedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to mark order as ready: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as ready';
      throw new BadRequestException(`${errorMessage}`);
    }
  }
}
