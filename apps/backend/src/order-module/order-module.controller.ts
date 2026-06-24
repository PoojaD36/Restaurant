import { Controller, Post, Get, Body, UseGuards, Request, Param, HttpCode, HttpStatus, ParseIntPipe, Put } from '@nestjs/common';
import { OrderModuleService } from './order-module.service';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OrderStatus } from 'src/database/generated/prisma/enums';

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
}
