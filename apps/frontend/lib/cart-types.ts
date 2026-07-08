/**
 * Shopping Cart Types
 */

import { ModifierOption } from './menu-types';

export interface CartModifier {
  modifierGroupId: number;
  modifierGroupName: string;
  type: 'SINGLE' | 'MULTIPLE';
  selectedOptions: ModifierOption[];
}

export interface CartItem {
  tempId: string; // Unique ID for cart item (UUID or timestamp-based)
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number; // Category ID for offer validation
  imageUrl?: string;
  modifiers: CartModifier[];
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  outletId: number;
  outletName: string;
  outletAddress?: string;
  // Offer/Discount fields
  appliedOffer?: {
    id: number;
    name: string;
    code: string;
    type: string;
    discountAmount: number;
  };
  discount?: number;
  deliveryFee?: number;
  total?: number;
}

export interface CartContextType {
  cart: CartState | null;
  addToCart: (item: Omit<CartItem, 'tempId'>) => void;
  removeFromCart: (tempId: string) => void;
  updateQuantity: (tempId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  setOutletInfo: (outletId: number, outletName: string, outletAddress?: string) => void;
}

// Storage key for localStorage
export const CART_STORAGE_KEY = 'foodhub_cart';
