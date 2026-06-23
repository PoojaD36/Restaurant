'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartContextType, CartItem, CartState, CART_STORAGE_KEY } from '../lib/cart-types';

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Cart Context Provider
 * Manages shopping cart state with localStorage persistence
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

  /**
   * Set outlet information for the cart
   * Items can only be added from one outlet at a time
   */
  const setOutletInfo = useCallback((
    outletId: number,
    outletName: string,
    outletAddress?: string
  ) => {
    setCart(prev => {
      // If cart has items from a different outlet, clear it
      if (prev && prev.items.length > 0 && prev.outletId !== outletId) {
        return {
          items: [],
          subtotal: 0,
          outletId,
          outletName,
          outletAddress,
        };
      }

      return {
        items: prev?.items || [],
        subtotal: prev?.subtotal || 0,
        outletId,
        outletName,
        outletAddress,
      };
    });
  }, []);

  /**
   * Add item to cart
   * If item with same modifiers exists, increase quantity
   * Otherwise add as new item
   */
  const addToCart = useCallback((item: Omit<CartItem, 'tempId'>) => {
    setCart(prev => {
      if (!prev || prev.outletId === 0) {
        throw new Error('Cart not initialized. Please select an outlet first.');
      }

      // Check if item with same modifiers already exists
      const existingItemIndex = prev.items.findIndex(existingItem =>
        existingItem.menuItemId === item.menuItemId &&
        JSON.stringify(existingItem.modifiers) === JSON.stringify(item.modifiers)
      );

      let newItems: CartItem[];

      if (existingItemIndex !== -1) {
        // Increase quantity of existing item
        newItems = prev.items.map((existingItem, index) =>
          index === existingItemIndex
            ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
            : existingItem
        );
      } else {
        // Add new item with unique tempId
        const tempId = `${item.menuItemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        newItems = [...prev.items, { ...item, tempId }];
      }

      // Calculate new subtotal
      const subtotal = newItems.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const modifiersTotal = item.modifiers.reduce((modSum, modifier) =>
          modSum + modifier.selectedOptions.reduce((optSum, option) =>
            optSum + option.priceAdjustment, 0
          ), 0) * item.quantity;
        return sum + itemTotal + modifiersTotal;
      }, 0);

      return {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
      };
    });
  }, []);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback((tempId: string) => {
    setCart(prev => {
      if (!prev) return null;

      const newItems = prev.items.filter(item => item.tempId !== tempId);
      const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((tempId: string, quantity: number) => {
    setCart(prev => {
      if (!prev) return null;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const newItems = prev.items.filter(item => item.tempId !== tempId);
        const subtotal = newItems.reduce((sum, item) => {
          const itemTotal = item.price * item.quantity;
          const modifiersTotal = item.modifiers.reduce((modSum, modifier) =>
            modSum + modifier.selectedOptions.reduce((optSum, option) =>
              optSum + option.priceAdjustment, 0
            ), 0) * item.quantity;
          return sum + itemTotal + modifiersTotal;
        }, 0);
        return {
          ...prev,
          items: newItems,
          subtotal: Math.round(subtotal * 100) / 100,
        };
      }

      const newItems = prev.items.map(item =>
        item.tempId === tempId ? { ...item, quantity } : item
      );

      const subtotal = newItems.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const modifiersTotal = item.modifiers.reduce((modSum, modifier) =>
          modSum + modifier.selectedOptions.reduce((optSum, option) =>
            optSum + option.priceAdjustment, 0
          ), 0) * item.quantity;
        return sum + itemTotal + modifiersTotal;
      }, 0);

      return {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });
  }, []);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  /**
   * Get total number of items in cart
   */
  const getCartItemCount = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    setOutletInfo,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to use cart context
 * Throws error if used outside CartProvider
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
