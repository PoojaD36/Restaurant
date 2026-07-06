import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDate,
  Min,
  Max,
  IsInt,
  Matches,
  validateOrReject,
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums matching Prisma schema
export enum OfferType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_DELIVERY = 'FREE_DELIVERY',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED',
}

export enum OfferScope {
  PUBLIC = 'PUBLIC',
  RESTAURANT = 'RESTAURANT',
  OUTLET = 'OUTLET',
}

export enum OfferCombinationType {
  EXCLUSIVE = 'EXCLUSIVE',
  STACKABLE = 'STACKABLE',
  BEST_DEAL = 'BEST_DEAL',
}

export class CreateOfferDto {
  // Basic Details
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(OfferType)
  @IsNotEmpty()
  type!: OfferType;

  @IsEnum(OfferStatus)
  @IsNotEmpty()
  status!: OfferStatus;

  @IsEnum(OfferScope)
  @IsNotEmpty()
  scope!: OfferScope;

  @IsOptional()
  @IsNumber()
  @IsInt()
  restaurantId?: number;

  // Discount Configuration
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  // Minimum Requirements
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  // Visibility
  @IsBoolean()
  @IsNotEmpty()
  requireCode!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isVisible!: boolean;

  // Usage Limits
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxUsesPerCustomer!: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  priority!: number;

  // Validity
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate!: Date;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  validDays?: number[]; // [0, 6] for Sunday, Saturday

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'validTimeStart must be in HH:MM format',
  })
  validTimeStart?: string; // "HH:MM" format

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'validTimeEnd must be in HH:MM format',
  })
  validTimeEnd?: string; // "HH:MM" format

  // Customer Rules
  @IsBoolean()
  @IsNotEmpty()
  firstOrderOnly!: boolean;

  // Combination
  @IsEnum(OfferCombinationType)
  @IsNotEmpty()
  combinationType!: OfferCombinationType;

  // Junction Data (for OfferOutlet, OfferCategory, OfferMenuItem)
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  outletIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  menuItemIds?: number[];

  // Custom validation for offer type requirements
  async validate() {
    await validateOrReject(this);

    // PERCENTAGE type requires percentageValue
    if (this.type === OfferType.PERCENTAGE && !this.percentageValue) {
      throw new Error('percentageValue is required for PERCENTAGE type');
    }

    // FIXED type requires fixedAmountValue
    if (this.type === OfferType.FIXED && !this.fixedAmountValue) {
      throw new Error('fixedAmountValue is required for FIXED type');
    }

    // BUY_ONE_GET_ONE can be configured in two ways:
    // 1. Specific menu items (restrict BOGO to certain items)
    // 2. General BOGO (applies to all items in cart)
    // If menuItemIds is provided, at least 1 item is required
    if (this.type === OfferType.BUY_ONE_GET_ONE && this.menuItemIds && this.menuItemIds.length > 0) {
      if (this.menuItemIds.length < 1) {
        throw new Error('BUY_ONE_GET_ONE requires at least 1 menu item when restricted to specific items');
      }
    }

    // RESTAURANT scope requires restaurantId
    if (this.scope === OfferScope.RESTAURANT && !this.restaurantId) {
      throw new Error('restaurantId is required for RESTAURANT scope');
    }

    // OUTLET scope requires outletIds
    if (this.scope === OfferScope.OUTLET && (!this.outletIds || this.outletIds.length === 0)) {
      throw new Error('outletIds is required for OUTLET scope');
    }

    // endDate must be after startDate
    if (this.endDate <= this.startDate) {
      throw new Error('endDate must be after startDate');
    }

    // If validTimeStart is provided, validTimeEnd must also be provided
    if ((this.validTimeStart && !this.validTimeEnd) || (!this.validTimeStart && this.validTimeEnd)) {
      throw new Error('Both validTimeStart and validTimeEnd must be provided together');
    }
  }
}
