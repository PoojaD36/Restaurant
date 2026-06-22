import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddAddressDto {
  @IsString()
  label!: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsString()
  postalCode!: string;

  @IsOptional()
  isDefault?: boolean;
}
