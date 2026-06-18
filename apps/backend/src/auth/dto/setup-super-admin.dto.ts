import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class SetupSuperAdminDto {
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}