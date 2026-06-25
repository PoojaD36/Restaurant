import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  orderId?: string; // Razorpay order ID

  @IsString()
  razorpayPaymentId?: string;

  @IsString()
  razorpaySignature!: string;
}
