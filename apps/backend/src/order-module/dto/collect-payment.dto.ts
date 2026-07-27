import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO for collecting payment at delivery
 * Used by delivery agents to record COD/online payments collected from customers
 */
export class CollectPaymentDto {
  /**
   * Payment method used (UPI, CARD, or CASH)
   * CASH = Cash payment
   * UPI = UPI payment (Google Pay, PhonePe, etc.)
   * CARD = Card payment (credit/debit)
   * Optional - not required for prepaid orders (payment status is COMPLETED)
   */
  @IsOptional()
  @IsEnum(['CASH', 'UPI', 'CARD'], {
    message: 'Payment method must be CASH, UPI, or CARD',
  })
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | undefined;

  /**
   * Transaction ID for UPI/CARD payments (optional)
   * For CASH payments, this can be omitted
   */
  @IsOptional()
  @IsString()
  transactionId?: string;

  /**
   * Optional notes about the payment collection
   */
  @IsOptional()
  @IsString()
  notes?: string;
}
