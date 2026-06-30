import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email or phone number for authentication',
    example: 'admin@restaurant.com',
  })
  @IsString()
  identifier!: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'Admin@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
