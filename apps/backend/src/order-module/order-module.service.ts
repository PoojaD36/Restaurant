import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { OrderStatus, OutletStatus, MenuItemStatus } from 'src/database/generated/prisma/enums';
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
        select: { id: true, status: true, customerId: true, outletId: true, pickedUpAt: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        PREPARING: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY],
        READY: [OrderStatus.OUT_FOR_DELIVERY],
        OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowedStatuses = validTransitions[order.status];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${status}. Valid transitions: ${allowedStatuses.join(', ')}`,
        );
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

      // Emit WebSocket notification to restaurant
      this.notificationsGateway.notifyOrderUpdated(order.outletId, {
        orderId: updatedOrder.id,
        outletId: order.outletId,
        status: updatedOrder.status,
        total: Number(updatedOrder.total),
        updatedAt: new Date(),
      });

      // Emit WebSocket notification to customer
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
}
