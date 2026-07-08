import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OFFOR_ERROR_MESSAGES, OFFER_DAYS } from '../constants/offer.constants';
import { OfferStatus, OfferScope, OfferType } from '../dto/create-offer.dto';
import { CartContext, OfferValidationResult, TimeValidation } from '../interfaces/offer-validation.interface';

@Injectable()
export class OfferValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate if an offer can be applied to a cart
   */
  async validateOffer(
    offerId: number,
    context: CartContext,
  ): Promise<OfferValidationResult> {
    // Fetch offer with all relations
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId, deletedAt: null },
      include: {
        outlets: true,
        categories: true,
        menuItems: true,
        restaurant: true,
      },
    });

    if (!offer) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_NOT_FOUND };
    }

    // Validate basic offer status
    const statusValidation = this.validateOfferStatus(offer);
    if (!statusValidation.isValid) {
      return statusValidation;
    }

    // Validate date and time
    const timeValidation = await this.validateOfferTime(offer);
    if (!timeValidation.isValidDay || !timeValidation.isValidTime || !timeValidation.isInDateRange) {
      if (!timeValidation.isInDateRange) {
        const now = new Date();
        if (now < offer.startDate) {
          return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_NOT_STARTED };
        }
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_EXPIRED };
      }
      if (!timeValidation.isValidDay) {
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.INVALID_DAY };
      }
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.INVALID_TIME };
    }

    // Validate scope and outlet applicability
    const scopeValidation = this.validateOfferScope(offer, context);
    if (!scopeValidation.isValid) {
      return scopeValidation;
    }

    // Validate minimum order amount
    if (offer.minOrderAmount && context.cartTotal < Number(offer.minOrderAmount)) {
      return {
        isValid: false,
        error: `${OFFOR_ERROR_MESSAGES.MIN_ORDER_AMOUNT}: ₹${offer.minOrderAmount}`,
      };
    }

    // Validate first order only
    if (offer.firstOrderOnly && !context.isFirstOrder) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.FIRST_ORDER_ONLY };
    }

    // Validate usage limits
    const usageValidation = await this.validateUsageLimits(offer, context.customerId);
    if (!usageValidation.isValid) {
      return usageValidation;
    }

    // Validate applicable items (for category/item specific offers)
    const itemsValidation = this.validateApplicableItems(offer, context);
    if (!itemsValidation.isValid) {
      return itemsValidation;
    }

    return { isValid: true, offer };
  }

  /**
   * Validate offer by code (for customer input)
   */
  async validateOfferByCode(
    code: string,
    context: CartContext,
  ): Promise<OfferValidationResult> {
    if (!code || code.trim() === '') {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.CODE_REQUIRED };
    }

    const offer = await this.prisma.offer.findUnique({
      where: { code: code.toUpperCase(), deletedAt: null },
      include: {
        outlets: true,
        categories: true,
        menuItems: true,
        restaurant: true,
      },
    });

    if (!offer) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.INVALID_CODE };
    }

    return this.validateOffer(offer.id, context);
  }

  /**
   * Validate offer status
   */
  private validateOfferStatus(offer: any): OfferValidationResult {
    if (offer.status === OfferStatus.DRAFT) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_INACTIVE };
    }

    if (offer.status === OfferStatus.PAUSED) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_PAUSED };
    }

    if (offer.status === OfferStatus.EXPIRED) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_EXPIRED };
    }

    if (offer.status !== OfferStatus.ACTIVE && offer.status !== OfferStatus.SCHEDULED) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_INACTIVE };
    }

    return { isValid: true };
  }

  /**
   * Validate offer date and time
   */
  private async validateOfferTime(offer: any): Promise<TimeValidation> {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check date range
    const isInDateRange = now >= offer.startDate && now <= offer.endDate;

    // Check valid days
    let isValidDay = true;
    if (offer.validDays && offer.validDays.length > 0) {
      isValidDay = offer.validDays.includes(currentDay);
    }

    // Check valid time range
    let isValidTime = true;
    if (offer.validTimeStart && offer.validTimeEnd) {
      const [startHour, startMin] = offer.validTimeStart.split(':').map(Number);
      const [endHour, endMin] = offer.validTimeEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      isValidTime = currentTime >= startMinutes && currentTime <= endMinutes;
    }

    return { isValidDay, isValidTime, isInDateRange };
  }

  /**
   * Validate offer scope and outlet applicability
   */
  private validateOfferScope(offer: any, context: CartContext): OfferValidationResult {
    switch (offer.scope) {
      case OfferScope.PUBLIC:
        // Public offers are applicable to all outlets
        return { isValid: true };

      case OfferScope.RESTAURANT:
        // Check if outlet belongs to the offer's restaurant
        if (offer.restaurantId && context.restaurantId === offer.restaurantId) {
          return { isValid: true };
        }
        // Check if outlet belongs to the restaurant
        if (offer.restaurant && context.restaurantId === offer.restaurant.id) {
          return { isValid: true };
        }
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_NOT_APPLICABLE };

      case OfferScope.OUTLET:
        // Check if outlet is in the offer's outlet list
        const isOutletValid = offer.outlets.some((o: any) => o.outletId === context.outletId);
        if (isOutletValid) {
          return { isValid: true };
        }
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_NOT_APPLICABLE };

      default:
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.OFFER_NOT_APPLICABLE };
    }
  }

  /**
   * Validate usage limits
   */
  private async validateUsageLimits(
    offer: any,
    customerId?: number,
  ): Promise<OfferValidationResult> {
    // Check global max uses
    if (offer.maxUses && offer.currentUses >= offer.maxUses) {
      return { isValid: false, error: OFFOR_ERROR_MESSAGES.MAX_USES_REACHED };
    }

    // Check customer-specific usage limit
    if (customerId && offer.maxUsesPerCustomer > 0) {
      const customerUsageCount = await this.prisma.offerUsage.count({
        where: {
          offerId: offer.id,
          customerId,
        },
      });

      if (customerUsageCount >= offer.maxUsesPerCustomer) {
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.CUSTOMER_LIMIT_REACHED };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate applicable items in cart
   */
  private validateApplicableItems(offer: any, context: CartContext): OfferValidationResult {
    const cartItemIds = context.items.map((item) => item.menuItemId);
    const cartCategoryIds = context.items
      .map((item) => item.categoryId)
      .filter((id) => id !== undefined);

    // Check if offer requires specific menu items
    if (offer.menuItems && offer.menuItems.length > 0) {
      const hasApplicableItems = offer.menuItems.some((item: any) =>
        cartItemIds.includes(item.menuItemId),
      );
      if (!hasApplicableItems) {
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.NO_APPLICABLE_ITEMS };
      }
    }

    // Check if offer requires specific categories
    if (offer.categories && offer.categories.length > 0) {
      const hasApplicableCategory = offer.categories.some((cat: any) =>
        cartCategoryIds.includes(cat.categoryId),
      );
      if (!hasApplicableCategory) {
        return { isValid: false, error: OFFOR_ERROR_MESSAGES.NO_APPLICABLE_ITEMS };
      }
    }

    // Special validation for BOGO - need at least 2 items
    if (offer.type === OfferType.BUY_ONE_GET_ONE) {
      const totalItems = context.items.reduce((sum, item) => sum + item.quantity, 0);

      if (offer.menuItems && offer.menuItems.length > 0) {
        // OFFER HAS SPECIFIC ITEMS - check that at least 2 of those items are in cart
        const qualifyingItems = context.items.filter((item) =>
          offer.menuItems.some((mi: any) => mi.menuItemId === item.menuItemId),
        );
        const qualifyingItemsCount = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);

        if (qualifyingItems.length === 0 || qualifyingItemsCount < 2) {
          return {
            isValid: false,
            error: `At least 2 qualifying items required for Buy One Get One offer (you have ${qualifyingItemsCount})`,
          };
        }
      } else {
        // OFFER APPLIES TO ALL ITEMS - check that at least 2 total items are in cart
        if (totalItems < 2) {
          return {
            isValid: false,
            error: `At least 2 items required for Buy One Get One offer (you have ${totalItems})`,
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Check if multiple offers can be combined
   */
  canCombineOffers(offers: any[]): boolean {
    if (offers.length === 0) return true;

    // Check if any offer is exclusive
    const hasExclusive = offers.some(
      (offer) => offer.combinationType === 'EXCLUSIVE',
    );
    if (hasExclusive && offers.length > 1) {
      return false;
    }

    // All offers must be STACKABLE or BEST_DEAL
    return offers.every(
      (offer) => offer.combinationType === 'STACKABLE' || offer.combinationType === 'BEST_DEAL',
    );
  }

  /**
   * Get the best deal from multiple offers
   */
  getBestOffer(discounts: any[]): any {
    if (discounts.length === 0) return null;
    return discounts.reduce((best, current) =>
      current.discountAmount > best.discountAmount ? current : best,
    );
  }
}
