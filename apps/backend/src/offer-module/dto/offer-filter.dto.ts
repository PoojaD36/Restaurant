import { IsOptional, IsEnum, IsNumber, IsInt, IsString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType, OfferStatus, OfferScope } from './create-offer.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class OfferFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OfferType)
  type?: OfferType;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsEnum(OfferScope)
  scope?: OfferScope;

  @IsOptional()
  @IsNumber()
  @IsInt()
  restaurantId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  outletId?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  requireCode?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  outletIds?: number[];

  @IsOptional()
  @IsString()
  search?: string; // Search by name or code
}
