import { IsString, IsOptional, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  oldPassword?: string; // Required for own password change, optional for admin

  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsOptional()
  userId?: number; // Optional for Super Admin to change another user's password
}
