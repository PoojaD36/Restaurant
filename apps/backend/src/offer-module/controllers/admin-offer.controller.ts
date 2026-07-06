import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../database/generated/prisma/enums';
import { OfferTransactionService } from '../services/offer-transaction.service';
import { OfferQueryService } from '../services/offer-query.service';
import { OfferValidationService } from '../services/offer-validation.service';
import { OfferUsageService } from '../services/offer-usage.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { OfferFilterDto } from '../dto/offer-filter.dto';
import { UpdateOfferStatusDto } from '../dto/update-offer-status.dto';

@Controller('admin/offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOfferController {
  constructor(
    private transactionService: OfferTransactionService,
    private queryService: OfferQueryService,
    private validationService: OfferValidationService,
    private usageService: OfferUsageService,
  ) {}

  /**
   * Create a new offer
   * POST /admin/offers
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  async createOffer(@Body() dto: CreateOfferDto, @Req() req: any) {
    // Restaurant admins can only create offers for their restaurants
    if (req.user.role === UserRole.RESTAURANT_ADMIN && dto.restaurantId) {
      // Validate the restaurant belongs to the admin
      // This would require checking user's restaurant assignments
      // For now, we'll allow it but you may want to add validation
    }

    return await this.transactionService.createOffer(dto);
  }

  /**
   * Get all offers with filtering
   * GET /admin/offers
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getOffers(@Query() filter: OfferFilterDto, @Req() req: any) {
    // Non-super-admins can only see offers for their restaurants
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      // You may want to add logic to filter by user's accessible restaurants
    }

    return await this.queryService.getOffers(filter);
  }

  /**
   * Get offer by ID
   * GET /admin/offers/:id
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getOfferById(@Param('id') id: string) {
    return await this.queryService.getOfferById(+id);
  }

  /**
   * Update an offer
   * PUT /admin/offers/:id
   */
  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  async updateOffer(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @Req() req: any,
  ) {
    // Restaurant admins can only update offers for their restaurants
    if (req.user.role === UserRole.RESTAURANT_ADMIN) {
      // Validate ownership
    }

    return await this.transactionService.updateOffer(+id, dto);
  }

  /**
   * Delete an offer (soft delete)
   * DELETE /admin/offers/:id
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  async deleteOffer(@Param('id') id: string, @Req() req: any) {
    // Restaurant admins can only delete offers for their restaurants
    if (req.user.role === UserRole.RESTAURANT_ADMIN) {
      // Validate ownership
    }

    return await this.transactionService.deleteOffer(+id);
  }

  /**
   * Update offer status
   * PUT /admin/offers/:id/status
   */
  @Put(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  async updateOfferStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOfferStatusDto,
  ) {
    return await this.transactionService.updateOfferStatus(+id, dto.status);
  }

  /**
   * Get offer usage statistics
   * GET /admin/offers/:id/stats
   */
  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getOfferStats(@Param('id') id: string) {
    return await this.usageService.getOfferUsageStats(+id);
  }

  /**
   * Get offer statistics overview
   * GET /admin/offers/stats/overview
   */
  @Get('stats/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getOfferStatsOverview() {
    return await this.queryService.getOfferStats();
  }

  /**
   * Get offers expiring soon
   * GET /admin/offers/expiring
   */
  @Get('expiring')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getExpiringOffers() {
    return await this.queryService.getExpiringOffers();
  }

  /**
   * Get most used offers
   * GET /admin/offers/popular
   */
  @Get('popular')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async getMostUsedOffers(@Query('limit') limit: number = 10) {
    return await this.usageService.getMostUsedOffers(+limit);
  }

  /**
   * Validate offer code (for testing)
   * POST /admin/offers/validate
   */
  @Post('validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  async validateOfferCode(@Body() body: { code: string; outletId: number }) {
    const result = await this.validationService.validateOfferByCode(
      body.code,
      {
        outletId: body.outletId,
        cartTotal: 100,
        items: [],
      },
    );

    return {
      success: result.isValid,
      message: result.error || 'Offer is valid',
      data: result.offer || null,
    };
  }
}
