'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartContextType, CartItem, CartState, CART_STORAGE_KEY } from '../lib/cart-types';
import {
  getCustomerCart,
  addCartItem,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  clearCustomerCart,
  serverCartToLocalCart,
  localCartItemToServerRequest,
} from '../lib/cart-api';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface ExtendedCartContextType extends CartContextType {
  syncCartFromServer: (outletId: number) => Promise<void>;
  isServerSyncing: boolean;
}

const CUSTOMER_TOKEN_KEY = 'customerAccessToken';

/**
 * Cart Context Provider
 * Manages shopping cart state with server-side synchronization for authenticated users
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [isServerSyncing, setIsServerSyncing] = useState(false);

  /**
   * Get customer token from localStorage
   */
  const getCustomerToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  }, []);

  /**
   * Sync entire local cart to server
   * Used after login when local cart exists
   */
  const syncLocalCartToServer = useCallback(async (token: string, outletId: number, currentCart: CartState | null) => {
    if (!currentCart || currentCart.items.length === 0) return;

    setIsServerSyncing(true);
    try {
      for (const item of currentCart.items) {
        const request = localCartItemToServerRequest(
          item,
          outletId,
          currentCart.outletName,
          currentCart.outletAddress
        );
        await addCartItem(token, request);
      }
      console.log('Local cart synced to server');
    } catch (error) {
      console.error('Failed to sync cart to server:', error);
    } finally {
      setIsServerSyncing(false);
    }
  }, []);

  /**
   * Sync cart from server
   * Called when customer logs in or switches outlets
   */
  const syncCartFromServer = useCallback(async (outletId: number) => {
    const token = getCustomerToken();
    if (!token) {
      console.log('No customer token, skipping server sync');
      return;
    }

    setIsServerSyncing(true);
    try {
      const response = await getCustomerCart(token, outletId);

      if (response.success && response.data) {
        const localCart = serverCartToLocalCart(response.data);

        if (localCart && localCart.items.length > 0) {
          setCart(localCart);
          console.log('Cart synced from server:', localCart);
        } else if (localCart) {
          // Server has empty cart - keep local cart and sync to server
          console.log('Server cart is empty, keeping local cart');
          // Local cart is already set, just sync to server
        }
      }
    } catch (error) {
      console.error('Failed to sync cart from server:', error);
    } finally {
      setIsServerSyncing(false);
    }
  }, [getCustomerToken]);

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

  // Listen for token changes and sync cart from server
  useEffect(() => {
    const handleTokenChange = () => {
      const token = getCustomerToken();
      if (token && cart && cart.outletId) {
        console.log('Token detected, syncing cart from server');
        syncCartFromServer(cart.outletId);
      }
    };

    // Listen for custom event when customer logs in
    window.addEventListener('customerLogin', handleTokenChange);
    window.addEventListener('customerLogout', handleTokenChange);

    return () => {
      window.removeEventListener('customerLogin', handleTokenChange);
      window.removeEventListener('customerLogout', handleTokenChange);
    };
  }, [cart, getCustomerToken, syncCartFromServer]);

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
   * Syncs to server if customer is authenticated
   */
  const addToCart = useCallback(async (item: Omit<CartItem, 'tempId'>) => {
    const token = getCustomerToken();

    setCart(prev => {
      if (!prev || prev.outletId === 0) {
        throw new Error('Cart not initialized. Please select an outlet first.');
      }

      // Check if user is authenticated
      if (!token) {
        throw new Error('Please log in to add items to cart');
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
        const tempId = `${item.menuItemId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

      const newCart = {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100,
      };

      // Sync to server in background
      (async () => {
        try {
          const request = localCartItemToServerRequest(
            item,
            prev.outletId,
            prev.outletName,
            prev.outletAddress
          );
          await addCartItem(token, request);
          console.log('Item synced to server');
        } catch (error) {
          console.error('Failed to sync item to server:', error);
        }
      })();

      return newCart;
    });
  }, [getCustomerToken]);

  /**
   * Remove item from cart
   * Syncs to server if customer is authenticated
   */
  const removeFromCart = useCallback(async (tempId: string) => {
    const token = getCustomerToken();

    setCart(prev => {
      if (!prev) return null;

      const item = prev.items.find(i => i.tempId === tempId);
      const newItems = prev.items.filter(item => item.tempId !== tempId);
      const subtotal = newItems.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const modifiersTotal = item.modifiers.reduce((modSum, modifier) =>
          modSum + modifier.selectedOptions.reduce((optSum, option) =>
            optSum + option.priceAdjustment, 0
          ), 0) * item.quantity;
        return sum + itemTotal + modifiersTotal;
      }, 0);

      const newCart = {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100,
      };

      // If item has server ID, remove from server
      if (token && item && tempId.startsWith('server-')) {
        const itemId = parseInt(tempId.replace('server-', ''));
        (async () => {
          try {
            await removeCartItemApi(token, itemId);
            console.log('Item removed from server');
          } catch (error) {
            console.error('Failed to remove item from server:', error);
          }
        })();
      }

      return newCart;
    });
  }, [getCustomerToken]);

  /**
   * Update item quantity
   * Syncs to server if customer is authenticated
   */
  const updateQuantity = useCallback(async (tempId: string, quantity: number) => {
    const token = getCustomerToken();

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
        const newCart = {
          ...prev,
          items: newItems,
          subtotal: Math.round(subtotal * 100) / 100,
        };

        // If item has server ID, remove from server
        if (token && tempId.startsWith('server-')) {
          const itemId = parseInt(tempId.replace('server-', ''));
          (async () => {
            try {
              await removeCartItemApi(token, itemId);
              console.log('Item removed from server (quantity 0)');
            } catch (error) {
              console.error('Failed to remove item from server:', error);
            }
          })();
        }

        return newCart;
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

      const newCart = {
        ...prev,
        items: newItems,
        subtotal: Math.round(subtotal * 100) / 100,
      };

      // If item has server ID, update on server
      if (token && tempId.startsWith('server-')) {
        const itemId = parseInt(tempId.replace('server-', ''));
        (async () => {
          try {
            await updateCartItemApi(token, itemId, quantity);
            console.log('Item quantity updated on server');
          } catch (error) {
            console.error('Failed to update item quantity on server:', error);
          }
        })();
      }

      return newCart;
    });
  }, [getCustomerToken]);

  /**
   * Clear entire cart
   * Clears from server if customer is authenticated
   */
  const clearCart = useCallback(async () => {
    const token = getCustomerToken();
    const outletId = cart?.outletId;

    setCart(null);

    if (token && outletId) {
      try {
        await clearCustomerCart(token, outletId);
        console.log('Cart cleared from server');
      } catch (error) {
        console.error('Failed to clear cart from server:', error);
      }
    }
  }, [cart?.outletId, getCustomerToken]);

  /**
   * Get total number of items in cart
   */
  const getCartItemCount = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value: ExtendedCartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    setOutletInfo,
    syncCartFromServer,
    isServerSyncing,
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
  return context as ExtendedCartContextType;
}
