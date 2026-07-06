import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomerJwtAuthGuard } from '../../customer-module/guards/customer-jwt-auth.guard';
import { OfferValidationService } from '../services/offer-validation.service';
import { OfferCalculationService } from '../services/offer-calculation.service';
import { OfferUsageService } from '../services/offer-usage.service';
import { OfferQueryService } from '../services/offer-query.service';
import { ApplyOfferDto } from '../dto/apply-offer.dto';
import { OFFOR_ERROR_MESSAGES } from '../constants/offer.constants';

@Controller('offers')
export class CustomerOfferController {
  constructor(
    private validationService: OfferValidationService,
    private calculationService: OfferCalculationService,
    private usageService: OfferUsageService,
    private queryService: OfferQueryService,
  ) {}

  /**
   * Get available offers for an outlet
   * GET /offers?outletId=123
   */
  @Get()
  async getAvailableOffers(@Query('outletId') outletId: number) {
    if (!outletId) {
      return {
        success: false,
        message: 'Outlet ID is required',
        data: [],
      };
    }

    const offers = await this.queryService.getActiveOffersForOutlet(outletId);

    return {
      success: true,
      message: 'Available offers retrieved successfully',
      data: offers,
    };
  }

  /**
   * Apply offer code to cart
   * POST /offers/apply
   */
  @Post('apply')
  @UseGuards(CustomerJwtAuthGuard)
  async applyOffer(@Body() dto: ApplyOfferDto, @Req() req: any) {
    const customerId = req.user.customerId;

    if (!dto.outletId) {
      return {
        success: false,
        message: 'Outlet ID is required',
        data: null,
      };
    }

    // First, check if this is customer's first order
    const customerOrders = await this.usageService.getCustomerUsageCount(
      0, // We'll use a dummy offer ID to get total order count
      customerId,
    );

    // Get the outlet to find restaurant ID
    // This requires injecting PrismaService or accessing via QueryService
    // For now, we'll pass null for restaurantId

    // Validate the offer
    const validationResult = await this.validationService.validateOfferByCode(
      dto.code,
      {
        outletId: dto.outletId,
        restaurantId: undefined,
        customerId,
        cartTotal: dto.cartTotal,
        items: dto.items,
        isFirstOrder: false, // You may want to implement this check
      },
    );

    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.error,
        data: null,
      };
    }

    // Calculate the discount
    const discountResult = this.calculationService.calculateDiscount(
      validationResult.offer,
      {
        outletId: dto.outletId,
        cartTotal: dto.cartTotal,
        items: dto.items,
      } as any,
      0, // delivery fee - you may want to pass this
    );

    return {
      success: true,
      message: 'Offer applied successfully',
      data: {
        discount: discountResult,
        offer: {
          id: validationResult.offer.id,
          name: validationResult.offer.name,
          code: validationResult.offer.code,
          type: validationResult.offer.type,
        },
      },
    };
  }

  /**
   * Get customer's offer usage history
   * GET /offers/my-usage
   */
  @Get('my-usage')
  @UseGuards(CustomerJwtAuthGuard)
  async getMyOfferUsage(@Req() req: any) {
    const customerId = req.user.customerId;

    const usages = await this.usageService.getCustomerOfferUsages(customerId);

    return {
      success: true,
      message: 'Offer usage history retrieved',
      data: usages,
    };
  }

  /**
   * Check if customer can use an offer
   * GET /offers/:id/check
   */
  @Get(':id/check')
  @UseGuards(CustomerJwtAuthGuard)
  async checkOfferAvailability(@Param('id') id: string, @Req() req: any) {
    const customerId = req.user.customerId;

    const canUse = await this.usageService.canCustomerUseOffer(+id, customerId);

    return {
      success: true,
      data: { canUse },
      message: canUse
        ? 'You can use this offer'
        : OFFOR_ERROR_MESSAGES.CUSTOMER_LIMIT_REACHED,
    };
  }

  /**
   * Preview discount for an offer (without applying)
   * POST /offers/preview
   */
  @Post('preview')
  async previewDiscount(@Body() body: ApplyOfferDto) {
    // Validate the offer
    const validationResult = await this.validationService.validateOfferByCode(
      body.code,
      {
        outletId: body.outletId,
        cartTotal: body.cartTotal,
        items: body.items,
        isFirstOrder: false,
      },
    );

    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.error,
        data: null,
      };
    }

    // Calculate the discount
    const discountResult = this.calculationService.calculateDiscount(
      validationResult.offer,
      {
        outletId: body.outletId,
        cartTotal: body.cartTotal,
        items: body.items,
      } as any,
      0, // delivery fee
    );

    return {
      success: true,
      message: 'Discount preview calculated',
      data: {
        discount: discountResult,
        offer: {
          id: validationResult.offer.id,
          name: validationResult.offer.name,
          code: validationResult.offer.code,
          type: validationResult.offer.type,
        },
      },
    };
  }
}
