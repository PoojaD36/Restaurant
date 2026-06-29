import { Controller, Post, Get, Body, UseGuards, Request, Param, HttpCode, HttpStatus, ParseIntPipe, Put, Query } from '@nestjs/common';
import { OrderModuleService } from './order-module.service';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDeliveryAgentDto, CollectPaymentDto, ClaimOrderDto, MarkOrderReadyDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OrderStatus, UserRole } from 'src/database/generated/prisma/enums';

@Controller('orders')
export class OrderModuleController {
  constructor(private readonly orderService: OrderModuleService) {}

  /**
   * Create new order
   */
  @Post('create')
  @UseGuards(CustomerJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.customerId, dto);
  }

  /**
   * Get customer's orders with pagination
   */
  @Get('my-orders')
  @UseGuards(CustomerJwtAuthGuard)
  async getCustomerOrders(
    @Request() req: any,
    @Body() paginationDto?: PaginationDto,
  ) {
    const dto = new PaginationDto();
    if (paginationDto) {
      dto.page = paginationDto.page || 1;
      dto.limit = paginationDto.limit || 10;
    }
    return this.orderService.getCustomerOrders(req.user.customerId, dto);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @UseGuards(CustomerJwtAuthGuard)
  async getOrderById(@Request() req: any, @Param('id', ParseIntPipe) orderId: number) {
    return this.orderService.getOrderById(orderId, req.user.customerId);
  }

  /**
   * Cancel order
   */
  @Post(':id/cancel')
  @UseGuards(CustomerJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Request() req: any, @Param('id', ParseIntPipe) orderId: number) {
    return this.orderService.cancelOrder(orderId, req.user.customerId);
  }

  /**
   * Update order status (admin/manager only)
   * Restaurant users can update order status which notifies the customer
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
      req.user.userId,
    );
  }

  /**
   * Get orders for a specific outlet (admin/manager only)
   */
  @Get('by-outlet/:outletId')
  @UseGuards(JwtAuthGuard)
  async getOutletOrders(
    @Request() req: any,
    @Param('outletId', ParseIntPipe) outletId: number,
    @Body('status') status?: OrderStatus,
    @Body('page') page?: number,
    @Body('limit') limit?: number,
  ) {
    const paginationDto = new PaginationDto();
    paginationDto.page = page || 1;
    paginationDto.limit = limit || 20;
    return this.orderService.getOutletOrders(outletId, paginationDto, status);
  }

  /**
   * Assign delivery agent to order
   */
  @Put(':id/delivery-agent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async assignDeliveryAgent(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() assignDeliveryAgentDto: AssignDeliveryAgentDto,
  ) {
    return this.orderService.assignDeliveryAgent(orderId, assignDeliveryAgentDto);
  }

  /**
   * Get orders for delivery agent
   */
  @Get('delivery-agent/my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT)
  async getDeliveryAgentOrders(
    @Request() req: any,
    @Body() paginationDto?: PaginationDto,
  ) {
    const dto = new PaginationDto();
    if (paginationDto) {
      dto.page = paginationDto.page || 1;
      dto.limit = paginationDto.limit || 20;
    }
    return this.orderService.getDeliveryAgentOrders(req.user.userId, dto);
  }

  /**
   * Update delivery agent location
   */
  @Put(':id/delivery-location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT)
  @HttpCode(HttpStatus.OK)
  async updateDeliveryLocation(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req: any,
    @Body() location: { latitude: number; longitude: number },
  ) {
    return this.orderService.updateDeliveryLocation(orderId, req.user.userId, location);
  }

  /**
   * Mark order as delivered (delivery agent only)
   * Only the assigned delivery agent can mark the order as delivered
   * For COD orders, payment details must be provided to complete the delivery
   */
  @Put(':id/mark-delivered')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT)
  @HttpCode(HttpStatus.OK)
  async markOrderAsDelivered(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req: any,
    @Body() collectPaymentDto?: CollectPaymentDto,
  ) {
    return this.orderService.markOrderAsDelivered(orderId, req.user.userId, collectPaymentDto);
  }

  /**
   * Get orders for chef (chef only)
   * Returns CONFIRMED orders (pending claim) and PREPARING orders (assigned to this chef)
   */
  @Get('chef/my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getChefOrders(
    @Request() req: any,
    @Query('outletId') outletId?: number,
  ) {
    return this.orderService.getChefOrders(req.user.userId, outletId);
  }

  /**
   * Claim an order (chef only)
   * Assigns the order to the chef and updates status to PREPARING
   */
  @Post(':id/claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  @HttpCode(HttpStatus.OK)
  async claimOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req: any,
    @Body() _claimOrderDto: ClaimOrderDto,
  ) {
    return this.orderService.claimOrder(orderId, req.user.userId);
  }

  /**
   * Mark order as ready (chef only)
   * Updates status to READY and sets completedAt timestamp
   */
  @Put(':id/mark-ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  @HttpCode(HttpStatus.OK)
  async markOrderReady(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req: any,
    @Body() _markOrderReadyDto: MarkOrderReadyDto,
  ) {
    return this.orderService.markOrderReady(orderId, req.user.userId);
  }
}
