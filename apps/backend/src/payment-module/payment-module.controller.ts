import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentModuleController {
  constructor(
    private readonly paymentService: PaymentModuleService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a Razorpay order for payment
   * POST /payments/create-order
   * Auth: Customer JWT required
   */
  @Post('create-order')
  @UseGuards(CustomerJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPaymentOrder(
    @Body() dto: CreatePaymentDto,
  ) {
    try {
      const razorpayOrder = await this.paymentService.createPaymentOrder(dto);

      return {
        success: true,
        message: 'Payment order created successfully',
        data: {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: this.configService.getOrThrow<string>('RAZORPAY_KEY_ID'),
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   * POST /payments/verify
   * Auth: Customer JWT required
   */
  @Post('verify')
  @UseGuards(CustomerJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    try {
      const result = await this.paymentService.verifyPayment(dto);

      if (!result.success) {
        return {
          success: false,
          message: 'Payment verification failed',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Payment verified successfully',
        data: null,
      };
    } catch (error) {
      throw new BadRequestException('Failed to verify payment');
    }
  }

  /**
   * Get payment status by order ID
   * GET /payments/:orderId
   * Auth: Customer JWT required
   */
  @Get(':orderId')
  @UseGuards(CustomerJwtAuthGuard)
  async getPaymentStatus(@Param('orderId') orderId: string) {
    try {
      const payment = await this.paymentService.getPaymentByOrderId(parseInt(orderId));

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };
    } catch (error) {
      throw new BadRequestException('Failed to get payment status');
    }
  }
}
