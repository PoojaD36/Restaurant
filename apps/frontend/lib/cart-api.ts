/**
 * Cart API Functions
 * Server-side cart synchronization
 */

import { CartItem, CartState } from './cart-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CartItemRequest {
  outletId: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  modifiers: Array<{
    modifierGroupId: number;
    modifierGroupName: string;
    type: string;
    selectedOptions: Array<{
      id: number;
      name: string;
      priceAdjustment: number;
    }>;
  }>;
  outletName?: string;
  outletAddress?: string;
}

export interface ServerCartItem {
  id: number;
  cartId: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  modifiers: any;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCartResponse {
  id: number | null;
  outletId: number;
  outletName: string | null;
  outletAddress: string | null;
  items: ServerCartItem[];
  subtotal: number;
}

/**
 * Get customer's cart from server
 */
export async function getCustomerCart(
  token: string,
  outletId: number
): Promise<{ success: boolean; data: ServerCartResponse }> {
  const response = await fetch(`${API_URL}/customers/cart?outletId=${outletId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart from server');
  }

  return response.json();
}

/**
 * Add item to server cart
 */
export async function addCartItem(
  token: string,
  item: CartItemRequest
): Promise<{ success: boolean; data: ServerCartResponse }> {
  const response = await fetch(`${API_URL}/customers/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error('Failed to add item to cart');
  }

  return response.json();
}

/**
 * Update cart item quantity on server
 */
export async function updateCartItem(
  token: string,
  itemId: number,
  quantity: number
): Promise<{ success: boolean; data: ServerCartResponse }> {
  const response = await fetch(`${API_URL}/customers/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart item');
  }

  return response.json();
}

/**
 * Remove item from server cart
 */
export async function removeCartItem(
  token: string,
  itemId: number
): Promise<{ success: boolean; data: ServerCartResponse }> {
  const response = await fetch(`${API_URL}/customers/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove cart item');
  }

  return response.json();
}

/**
 * Clear server cart for specific outlet
 */
export async function clearCustomerCart(
  token: string,
  outletId: number
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/customers/cart?outletId=${outletId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to clear cart');
  }

  return response.json();
}

/**
 * Convert server cart response to local CartState
 */
export function serverCartToLocalCart(serverCart: ServerCartResponse): CartState | null {
  if (!serverCart || !serverCart.outletName) {
    return null;
  }

  return {
    items: serverCart.items.map((item) => ({
      tempId: `server-${item.id}`,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers || [],
    })),
    subtotal: serverCart.subtotal,
    outletId: serverCart.outletId,
    outletName: serverCart.outletName || '',
    outletAddress: serverCart.outletAddress || undefined,
  };
}

/**
 * Convert local cart item to server cart item request
 */
export function localCartItemToServerRequest(
  item: Omit<CartItem, 'tempId'>,
  outletId: number,
  outletName: string,
  outletAddress?: string
): CartItemRequest {
  return {
    outletId,
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    modifiers: item.modifiers.map((mod) => ({
      modifierGroupId: mod.modifierGroupId,
      modifierGroupName: mod.modifierGroupName,
      type: mod.type,
      selectedOptions: mod.selectedOptions.map((opt) => ({
        id: opt.id,
        name: opt.name,
        priceAdjustment: opt.priceAdjustment,
      })),
    })),
    outletName,
    outletAddress,
  };
}
