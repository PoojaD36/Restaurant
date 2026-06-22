import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty, Min } from 'class-validator';

export class CreateModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  priceAdjustment!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  displayOrder?: number;
}
