import { Controller, Post, Get, Body, UseGuards, Request, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { OrderModuleService } from './order-module.service';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

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
}
