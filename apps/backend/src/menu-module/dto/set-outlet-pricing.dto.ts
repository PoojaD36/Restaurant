import { IsNumber, IsBoolean, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class SetOutletPricingDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}

export class BulkSetOutletPricingDto {
  @IsNumber()
  @IsNotEmpty()
  itemId!: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
