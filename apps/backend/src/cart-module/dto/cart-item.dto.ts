import { IsNumber, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ModifierOptionDto {
  id!: number;
  name!: string;
  priceAdjustment!: number;
}

export class ModifierDto {
  modifierGroupId!: number;
  modifierGroupName!: string;
  type!: string;
  selectedOptions!: ModifierOptionDto[];
}

export class AddCartItemDto {
  @IsNumber()
  outletId!: number;

  @IsNumber()
  menuItemId!: number;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  modifiers!: ModifierDto[];

  @IsString()
  @IsOptional()
  outletName?: string;

  @IsString()
  @IsOptional()
  outletAddress?: string;
}

export class UpdateCartItemDto {
  @IsNumber()
  quantity!: number;
}

export class GetCartDto {
  @IsNumber()
  outletId!: number;
}
