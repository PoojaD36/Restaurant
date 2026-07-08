import { Injectable } from '@nestjs/common';
import { OfferType } from '../dto/create-offer.dto';
import { CartContext } from '../interfaces/offer-validation.interface';
import { DiscountResult } from '../interfaces';

@Injectable()
export class OfferCalculationService {
  /**
   * Calculate discount for a single offer
   */
  calculateDiscount(
    offer: any,
    context: CartContext,
    deliveryFee: number = 0,
  ): DiscountResult {
    const originalAmount = context.cartTotal;
    let discountAmount = 0;
    let deliveryFeeWaived = false;
    let freeItem = undefined;

    switch (offer.type) {
      case OfferType.PERCENTAGE:
        discountAmount = this.calculatePercentageDiscount(
          offer,
          context.cartTotal,
        );
        break;

      case OfferType.FIXED:
        discountAmount = this.calculateFixedDiscount(offer);
        break;

      case OfferType.FREE_DELIVERY:
        deliveryFeeWaived = true;
        discountAmount = deliveryFee;
        break;

      case OfferType.BUY_ONE_GET_ONE:
        const bogoResult = this.calculateBogoDiscount(offer, context);
        discountAmount = bogoResult.discountAmount;
        freeItem = bogoResult.freeItem;
        break;

      default:
        discountAmount = 0;
    }

    // Apply max discount cap if set
    if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
      discountAmount = Number(offer.maxDiscountAmount);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const savings = deliveryFeeWaived ? deliveryFee : discountAmount;

    return {
      discountAmount,
      discountType: offer.type,
      originalAmount,
      finalAmount,
      appliedOffer: {
        id: offer.id,
        name: offer.name,
        code: offer.code,
        description: offer.description,
      },
      freeItem,
      deliveryFeeWaived,
      savings,
    };
  }

  /**
   * Calculate percentage discount
   */
  private calculatePercentageDiscount(offer: any, cartTotal: number): number {
    if (!offer.percentageValue) return 0;

    const discount = (cartTotal * Number(offer.percentageValue)) / 100;

    // Apply max discount cap if set
    if (offer.maxDiscountAmount) {
      return Math.min(discount, Number(offer.maxDiscountAmount));
    }

    return discount;
  }

  /**
   * Calculate fixed amount discount
   */
  private calculateFixedDiscount(offer: any): number {
    if (!offer.fixedAmountValue) return 0;
    return Number(offer.fixedAmountValue);
  }

  /**
   * Calculate Buy One Get One discount
   * For every 2 items of the same type, customer pays for 1
   * Example: 3 items @ ₹199 = 2 paid + 1 free = ₹398 (discount ₹199)
   *
   * If offer.menuItems is empty/null: apply BOGO to ALL cart items
   * If offer.menuItems has items: apply BOGO only to those specific items
   */
  private calculateBogoDiscount(
    offer: any,
    context: CartContext,
  ): { discountAmount: number; freeItem?: any } {
    let applicableItems: any[] = [];

    // Check if offer has specific menu items configured
    if (offer.menuItems && offer.menuItems.length > 0) {
      // OFFER HAS SPECIFIC ITEMS - apply BOGO only to those items
      const qualifyingItemIds = offer.menuItems.map((mi: any) => mi.menuItemId);
      applicableItems = context.items.filter((item) =>
        qualifyingItemIds.includes(item.menuItemId),
      );

      if (applicableItems.length === 0) {
        return { discountAmount: 0 };
      }
    } else {
      // OFFER HAS NO SPECIFIC ITEMS - apply BOGO to ALL cart items
      applicableItems = context.items;

      if (applicableItems.length === 0) {
        return { discountAmount: 0 };
      }
    }

    // Group items by menuItemId to calculate free items per unique item
    const itemGroups = new Map<number, { price: number; name: string; totalQty: number }>();

    applicableItems.forEach((item) => {
      const existing = itemGroups.get(item.menuItemId);
      if (existing) {
        existing.totalQty += item.quantity;
      } else {
        itemGroups.set(item.menuItemId, {
          price: item.price,
          name: item.name,
          totalQty: item.quantity,
        });
      }
    });

    // Calculate discount: for each group, floor(quantity / 2) items are free
    let totalDiscount = 0;
    let freeItemDetails: any = null;

    itemGroups.forEach((details, menuItemId) => {
      const freeItemCount = Math.floor(details.totalQty / 2);
      if (freeItemCount > 0) {
        totalDiscount += details.price * freeItemCount;
        // Store first free item details for display
        if (!freeItemDetails) {
          freeItemDetails = {
            menuItemId,
            name: details.name,
            quantity: freeItemCount,
          };
        }
      }
    });

    return {
      discountAmount: totalDiscount,
      freeItem: freeItemDetails,
    };
  }

  /**
   * Calculate multiple offers and return the best deal
   */
  calculateBestDeal(
    offers: any[],
    context: CartContext,
    deliveryFee: number = 0,
  ): DiscountResult {
    if (offers.length === 0) {
      return {
        discountAmount: 0,
        discountType: 'PERCENTAGE',
        originalAmount: context.cartTotal,
        finalAmount: context.cartTotal,
        deliveryFeeWaived: false,
        savings: 0,
      };
    }

    const discounts = offers.map((offer) =>
      this.calculateDiscount(offer, context, deliveryFee),
    );

    // Return the discount with highest savings
    return discounts.reduce((best, current) =>
      current.savings > best.savings ? current : best,
    );
  }

  /**
   * Calculate stackable discounts (sum of all applicable offers)
   */
  calculateStackableDiscounts(
    offers: any[],
    context: CartContext,
    deliveryFee: number = 0,
  ): DiscountResult {
    if (offers.length === 0) {
      return {
        discountAmount: 0,
        discountType: 'PERCENTAGE',
        originalAmount: context.cartTotal,
        finalAmount: context.cartTotal,
        deliveryFeeWaived: false,
        savings: 0,
      };
    }

    let totalDiscount = 0;
    let deliveryFeeWaived = false;
    let appliedOffers: any[] = [];

    for (const offer of offers) {
      const discount = this.calculateDiscount(offer, context, deliveryFee);
      totalDiscount += discount.discountAmount;

      if (discount.deliveryFeeWaived) {
        deliveryFeeWaived = true;
      }

      appliedOffers.push(discount.appliedOffer);
    }

    // Cap total discount at cart total
    totalDiscount = Math.min(totalDiscount, context.cartTotal);

    return {
      discountAmount: totalDiscount,
      discountType: 'FIXED',
      originalAmount: context.cartTotal,
      finalAmount: Math.max(0, context.cartTotal - totalDiscount),
      appliedOffer: appliedOffers.length > 0 ? appliedOffers[0] : undefined,
      deliveryFeeWaived,
      savings: deliveryFeeWaived ? deliveryFee + totalDiscount : totalDiscount,
    };
  }

  /**
   * Get applicable items for an offer
   */
  getApplicableItems(offer: any, cartItems: any[]): any[] {
    if (!offer.menuItems || offer.menuItems.length === 0) {
      // If no specific menu items, all items are applicable
      return cartItems;
    }

    const qualifyingItemIds = offer.menuItems.map((mi: any) => mi.menuItemId);
    return cartItems.filter((item) => qualifyingItemIds.includes(item.menuItemId));
  }

  /**
   * Calculate discount for specific items only
   */
  calculateItemLevelDiscount(
    offer: any,
    cartItems: any[],
  ): { discountAmount: number; applicableItems: any[] } {
    const applicableItems = this.getApplicableItems(offer, cartItems);

    if (applicableItems.length === 0) {
      return { discountAmount: 0, applicableItems: [] };
    }

    let discountAmount = 0;

    switch (offer.type) {
      case OfferType.PERCENTAGE:
        const itemsTotal = applicableItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        discountAmount = this.calculatePercentageDiscount(offer, itemsTotal);
        break;

      case OfferType.FIXED:
        discountAmount = this.calculateFixedDiscount(offer);
        break;

      case OfferType.BUY_ONE_GET_ONE:
        const bogoResult = this.calculateBogoDiscount(
          offer,
          { items: applicableItems, cartTotal: 0 } as any,
        );
        discountAmount = bogoResult.discountAmount;
        break;

      default:
        discountAmount = 0;
    }

    // Apply max discount cap
    if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
      discountAmount = Number(offer.maxDiscountAmount);
    }

    return { discountAmount, applicableItems };
  }
}

