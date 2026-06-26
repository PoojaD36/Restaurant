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
   */
  @IsEnum(['CASH', 'UPI', 'CARD'], {
    message: 'Payment method must be CASH, UPI, or CARD',
  })
  paymentMethod: 'CASH' | 'UPI' | 'CARD';

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
