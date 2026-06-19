import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  get pageValue(): number {
    return this.page || 1;
  }

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  get limitValue(): number {
    return this.limit || 10;
  }
}
