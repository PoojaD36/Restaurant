import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  static readonly MAX_PER_PAGE = 100;
  static readonly DEFAULT_PER_PAGE = 10;
  static readonly DEFAULT_PAGE = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = PaginationDto.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(PaginationDto.MAX_PER_PAGE)
  limit: number = PaginationDto.DEFAULT_PER_PAGE;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PaginationMeta {
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
  readonly nextPage: number | null;
  readonly prevPage: number | null;
  readonly from: number;
  readonly to: number;


  constructor(total: number, currentPage: number, perPage: number) {
    this.total = total;
    this.currentPage = currentPage;
    this.perPage = perPage;

    this.totalPages = Math.ceil(total / perPage);
    this.hasNextPage = currentPage < this.totalPages;
    this.hasPrevPage = currentPage > 1;
    this.nextPage = this.hasNextPage ? currentPage + 1 : null;
    this.prevPage = this.hasPrevPage ? currentPage - 1 : null;

    this.from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    this.to = total === 0 ? 0 : Math.min(currentPage * perPage, total);
  }
}
