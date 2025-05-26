'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Cart, CartItem, calcCartSummary } from '@/app/lib/pricing';
import { getCurrentDraftCart, getCartItems, addItemToCart, updateCartItem, removeCartItem, finalizeCart } from '@/app/actions/cart';
import { useRouter } from 'next/navigation';

// Define the cart item type with more details for UI
export interface DetailedCartItem extends CartItem {
  details: any; // The full meal or packet details
  netPrice: number;
  grossPrice: number;
}

// Define the cart summary type
export interface CartSummary {
  nettoTotal: number;
  bruttoTotal: number;
  avgMarkupPct: number;
}

// Define the cart context state
interface CartContextState {
  cart: Cart | null;
  cartItems: DetailedCartItem[];
  isLoading: boolean;
  cartSummary: CartSummary;
  addItem: (itemType: 'meal' | 'packet', itemId: string, markupPct: number) => Promise<void>;
  updateItem: (itemId: string, markupPct: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  finalizeCurrentCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Create the context
const CartContext = createContext<CartContextState | undefined>(undefined);

// Create a provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<DetailedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate cart summary using our pricing utility
  const cartSummary = useMemo(() => {
    if (!cartItems.length) {
      return {
        nettoTotal: 0,
        bruttoTotal: 0,
        avgMarkupPct: 0
      };
    }
    
    // This is a simplified version as our actual CartItem type might differ
    return calcCartSummary(cartItems as any);
  }, [cartItems]);

  // Load the current draft cart
  const loadCart = async () => {
    try {
      setIsLoading(true);
      const currentCart = await getCurrentDraftCart();
      setCart(currentCart);
      
      if (currentCart) {
        const items = await getCartItems(currentCart.id);
        
        // Calculate net and gross prices for each item
        const enhancedItems = items.map((item: any) => {
          // This is simplified - actual calculation would use the pricing utils
          const netPrice = item.details?.price_net_override || 0; // Simplified
          const grossPrice = netPrice * (1 + item.markup_pct / 100);
          
          return {
            ...item,
            netPrice,
            grossPrice
          } as DetailedCartItem;
        });
        
        setCartItems(enhancedItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCart();
  }, []);

  // Add item to cart
  const addItem = async (itemType: 'meal' | 'packet', itemId: string, markupPct: number) => {
    if (!cart) return;
    
    try {
      setIsLoading(true);
      await addItemToCart({
        cart_id: cart.id,
        item_type: itemType,
        item_id: itemId,
        markup_pct: markupPct
      });
      
      // Refresh cart data
      await loadCart();
    } catch (error) {
      console.error('Error adding item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item
  const updateItem = async (itemId: string, markupPct: number) => {
    if (!cart) return;
    
    try {
      setIsLoading(true);
      const itemToUpdate = cartItems.find(item => item.id === itemId);
      
      if (itemToUpdate) {
        await updateCartItem({
          id: itemId,
          cart_id: cart.id,
          item_type: itemToUpdate.item_type,
          item_id: itemToUpdate.item_id,
          markup_pct: markupPct
        });
      }
      
      // Refresh cart data
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      await removeCartItem(itemId);
      
      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing cart item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize cart and create new draft
  const finalizeCurrentCart = async () => {
    if (!cart) return;
    
    try {
      setIsLoading(true);
      await finalizeCart(cart.id);
      
      // Refresh to load the new draft cart
      await loadCart();
      router.refresh();
    } catch (error) {
      console.error('Error finalizing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const value = {
    cart,
    cartItems,
    isLoading,
    cartSummary,
    addItem,
    updateItem,
    removeItem,
    finalizeCurrentCart,
    refreshCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
