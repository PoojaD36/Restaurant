import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, Min } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

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
