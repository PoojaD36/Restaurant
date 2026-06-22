import { IsString, IsOptional, MinLength, IsEmail, Matches } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Matches(/^[0-9]{10,15}$/, { message: 'Phone must be a valid number with 10-15 digits' })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
