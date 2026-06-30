import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password (required for non-admin users changing their own password)',
    example: 'OldPassword@123',
  })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewPassword@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiPropertyOptional({
    description: 'User ID (only used by SUPER_ADMIN to change another user\'s password)',
    example: 1,
  })
  @IsOptional()
  userId?: number;
}
