import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../database/generated/prisma/enums';

export enum DateRange {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

export class GetDashboardStatsDto {
  @ApiPropertyOptional({
    description: 'Filter statistics by date range',
    enum: DateRange,
    example: DateRange.ALL,
  })
  @IsOptional()
  @IsEnum(DateRange)
  dateRange?: DateRange;

  @ApiPropertyOptional({
    description: 'Filter by restaurant ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by outlet ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  outletId?: string;
}
