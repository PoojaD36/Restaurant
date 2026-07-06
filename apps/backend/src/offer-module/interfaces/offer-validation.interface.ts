/**
 * Offer Validation Interface
 */

export interface OfferValidationResult {
  isValid: boolean;
  error?: string;
  offer?: any;
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number;
}

export interface CartContext {
  outletId: number;
  restaurantId?: number;
  customerId?: number;
  cartTotal: number;
  items: CartItem[];
  isFirstOrder?: boolean;
}

export interface TimeValidation {
  isValidDay: boolean;
  isValidTime: boolean;
  isInDateRange: boolean;
}
