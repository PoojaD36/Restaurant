import { IsNotEmpty, IsOptional, IsNumber, IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderModifierDto {
  modifierGroupId!: number;
  modifierGroupName!: string;
  type!: 'SINGLE' | 'MULTIPLE';
  selectedOptions!: Array<{
    id: number;
    name: string;
    priceAdjustment: number;
  }>;
}

export class OrderItemDto {
  @IsNumber()
  menuItemId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderModifierDto)
  modifiers!: OrderModifierDto[];
}

export class CreateOrderDto {
  @IsNumber()
  outletId!: number;

  @IsNumber()
  addressId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsEnum(['CASH', 'CARD', 'UPI', 'WALLET'])
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET';

  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;
}
