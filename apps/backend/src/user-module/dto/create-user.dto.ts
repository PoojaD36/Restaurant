import { IsEmail, IsString, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/database/generated/prisma/enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@restaurant.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.MANAGER,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
