import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  basePrice!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isVegetarian?: boolean;

  @IsOptional()
  @IsBoolean()
  isSpicy?: boolean;

  @IsOptional()
  @IsInt()
  preparationTime?: number;

  @IsOptional()
  @IsInt()
  calories?: number;

  @IsOptional()
  status?: 'AVAILABLE' | 'UNAVAILABLE';
}
