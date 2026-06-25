import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RazorpayOrderResponse, VerifyPaymentResponse } from './interfaces/razorpay-response.interface';
import * as crypto from 'crypto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class PaymentModuleService {
  private razorpay: Razorpay | null = null;
  private readonly logger = new Logger(PaymentModuleService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
    } else {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  /**
   * Create a Razorpay order for payment
   * @param dto Payment creation data with amount and optional order ID
   * @returns Razorpay order response with order ID and amount in paise
   */
  async createPaymentOrder(dto: CreatePaymentDto): Promise<RazorpayOrderResponse> {
    if (!this.razorpay) {
      throw new BadRequestException('Payment service is not configured');
    }

    try {
      const options = {
        amount: dto.amount * 100, // Convert to paise (₹500 = 50000 paise)
        currency: 'INR',
        receipt: dto.orderId ? `order_${dto.orderId}` : `order_${Date.now()}`,
      };

      const razorpayOrder = await this.razorpay.orders.create(options);
      this.logger.log(`Created Razorpay order: ${razorpayOrder.id} for amount: ₹${dto.amount}`);

      return razorpayOrder as RazorpayOrderResponse;
    } catch (error) {
      this.logger.error('Failed to create Razorpay order:', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   * This ensures the payment is authentic and not tampered with
   * @param dto Payment verification data
   * @returns Verification result
   */
  async verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    if (!this.razorpay) {
      throw new BadRequestException('Payment service is not configured');
    }

    try {
      const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') as string;

      // Generate HMAC SHA256 signature
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${dto.orderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      // Compare generated signature with received signature
      const isValid = generatedSignature === dto.razorpaySignature;

      if (isValid) {
        this.logger.log(`Payment verified successfully: ${dto.razorpayPaymentId}`);
        return {
          success: true,
          message: 'Payment verified successfully',
        };
      } else {
        this.logger.warn(`Payment verification failed: ${dto.razorpayPaymentId}`);
        return {
          success: false,
          message: 'Payment verification failed',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      throw new BadRequestException('Error verifying payment');
    }
  }

  /**
   * Get payment status by order ID
   * @param orderId Order ID
   * @returns Payment details
   */
  async getPaymentByOrderId(orderId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
    };
  }
}
