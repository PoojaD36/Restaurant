import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  menuItemId!: number;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}

export class ApplyOfferDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @IsNotEmpty()
  outletId!: number;

  @IsNumber()
  @IsNotEmpty()
  cartTotal!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
