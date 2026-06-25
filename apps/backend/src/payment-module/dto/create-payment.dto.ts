import { IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount!: number;

  @IsNumber()
  @IsOptional()
  orderId?: number; // Optional order ID for receipt
}
