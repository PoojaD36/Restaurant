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

  // Load cart from localStorage on mount and sync from server if authenticated
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    let storedCart: CartState | null = null;
    if (stored) {
      try {
        storedCart = JSON.parse(stored);
        setCart(storedCart);
      } catch (error) {
        console.error('Failed to parse stored cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }

    // If user is authenticated and has a stored cart with outletId, sync from server
    const token = getCustomerToken();
    if (token && storedCart && storedCart.outletId) {
      console.log('User is authenticated with stored cart, syncing from server on mount');
      (async () => {
        try {
          const response = await getCustomerCart(token, storedCart.outletId);
          if (response.success && response.data) {
            const serverCart = serverCartToLocalCart(response.data);
            if (serverCart && serverCart.items.length > 0) {
              setCart(serverCart);
              console.log('Cart synced from server on mount:', serverCart);
            }
          }
        } catch (error) {
          console.error('Failed to sync cart from server on mount:', error);
        }
      })();
    }
  }, [getCustomerToken]);

  // Listen for token changes and sync cart from server
  useEffect(() => {
    const handleLogin = () => {
      const token = getCustomerToken();
      if (token && cart && cart.outletId) {
        console.log('Customer logged in, syncing cart from server for outlet:', cart.outletId);
        syncCartFromServer(cart.outletId);
      } else if (token) {
        console.log('Customer logged in, but no outlet set yet. Will sync when outlet is selected.');
      }
    };

    const handleLogout = () => {
      console.log('Customer logged out, clearing cart');
      setCart(null);
    };

    // Listen for custom events when customer logs in/out
    window.addEventListener('customerLogin', handleLogin);
    window.addEventListener('customerLogout', handleLogout);

    return () => {
      window.removeEventListener('customerLogin', handleLogin);
      window.removeEventListener('customerLogout', handleLogout);
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
   * Syncs from server if user is authenticated and cart is empty
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

      const newCart = {
        items: prev?.items || [],
        subtotal: prev?.subtotal || 0,
        outletId,
        outletName,
        outletAddress,
      };

      // Sync from server if:
      // 1. User is authenticated (has token)
      // 2. Cart is empty or has no items
      // 3. This is a new outlet (not just updating address)
      const token = getCustomerToken();
      const shouldSyncFromServer = token && (!prev || prev.items.length === 0 || prev.outletId !== outletId);

      if (shouldSyncFromServer) {
        // Async sync from server - don't block the UI
        (async () => {
          try {
            const response = await getCustomerCart(token, outletId);
            if (response.success && response.data) {
              const serverCart = serverCartToLocalCart(response.data);
              if (serverCart && serverCart.items.length > 0) {
                // Update cart with server data
                setCart(currentCart => {
                  // Only update if still on the same outlet
                  if (currentCart?.outletId === outletId) {
                    return serverCart;
                  }
                  return currentCart;
                });
                console.log('Cart synced from server for outlet:', outletId);
              }
            }
          } catch (error) {
            console.error('Failed to sync cart from server:', error);
          }
        })();
      }

      return newCart;
    });
  }, [getCustomerToken]);

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
