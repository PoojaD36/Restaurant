/**
 * Menu Types for Customer-facing Menu Browsing
 * These types match the public menu API response structure
 */

export interface PublicMenu {
  id: number;
  name: string;
  description?: string;
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: number;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number; // Outlet-specific price
  basePrice: number;
  imageUrl?: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  available: boolean;
  modifiers?: ModifierGroup[];
}

export interface ModifierGroup {
  id: number;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: number;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

/**
 * Cart-related menu item types
 */
export interface CartModifier {
  modifierGroupId: number;
  modifierGroupName: string;
  type: 'SINGLE' | 'MULTIPLE';
  selectedOptions: ModifierOption[];
}

export interface CartMenuItem {
  tempId: string; // Unique ID for cart item
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  modifiers: CartModifier[];
}
