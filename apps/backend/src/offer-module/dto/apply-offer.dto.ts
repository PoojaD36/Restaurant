import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  menuItemId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
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
