/**
 * Discount Calculation Result Interface
 */

export interface DiscountResult {
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY' | 'BUY_ONE_GET_ONE';
  originalAmount: number;
  finalAmount: number;
  appliedOffer?: {
    id: number;
    name: string;
    code: string;
    description?: string;
  };
  freeItem?: {
    menuItemId: number;
    name: string;
    quantity: number;
  };
  deliveryFeeWaived: boolean;
  savings: number;
}

export interface ApplicableOffer {
  offerId: number;
  name: string;
  code: string;
  type: string;
  discountAmount: number;
  discountValue?: number;
  description?: string;
}
