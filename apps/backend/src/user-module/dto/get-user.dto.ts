import { PaginationDto } from 'src/common';
import { IsOptional, IsEnum, IsIn } from 'class-validator';
import { UserRole, UserStatus } from 'src/database/generated/prisma/enums';

export class GetUserDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
