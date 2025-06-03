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
  quantity: number; // Add quantity to cart items
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
  addItem: (itemType: 'meal' | 'packet', itemId: string, quantity: number, markupPct: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItemMarkup: (itemId: string, markupPct: number) => Promise<void>;
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

  // Calculate cart summary using a safe approach
  const cartSummary = useMemo(() => {
    if (!cartItems || !cartItems.length) {
      return {
        nettoTotal: 0,
        bruttoTotal: 0,
        avgMarkupPct: 0
      };
    }
    
    // Calculate totals considering quantities
    let nettoTotal = 0;
    let bruttoTotal = 0;
    let weightedMarkupSum = 0;
    
    cartItems.forEach(item => {
      const itemNet = (item.netPrice || 0) * item.quantity;
      const itemGross = (item.grossPrice || itemNet * (1 + item.markup_pct / 100)) * item.quantity;
      
      nettoTotal += itemNet;
      bruttoTotal += itemGross;
      weightedMarkupSum += item.markup_pct * itemNet;
    });
    
    const avgMarkupPct = nettoTotal > 0 ? weightedMarkupSum / nettoTotal : 0;
    
    return {
      nettoTotal,
      bruttoTotal,
      avgMarkupPct
    };
  }, [cartItems]);

  // Load the current draft cart
  const loadCart = async () => {
    try {
      setIsLoading(true);
      const currentCart = await getCurrentDraftCart();
      setCart(currentCart);
      
      if (currentCart) {
        const items = await getCartItems(currentCart.id);
        
        // Group items by item_id and markup_pct to combine quantities
        const groupedItems = new Map<string, DetailedCartItem>();
        
        (items || []).forEach((item: any) => {
          const key = `${item.item_id}_${item.markup_pct}`;
          const netPrice = item.details?.price_net_override || 10; // Default price for demo
          const grossPrice = netPrice * (1 + (item.markup_pct || 0) / 100);
          
          if (groupedItems.has(key)) {
            // Item exists, increment quantity
            const existingItem = groupedItems.get(key)!;
            existingItem.quantity += 1;
          } else {
            // New item
            groupedItems.set(key, {
              ...item,
              netPrice,
              grossPrice,
              markup_pct: item.markup_pct || 0,
              quantity: 1
            } as DetailedCartItem);
          }
        });
        
        setCartItems(Array.from(groupedItems.values()));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCart();
  }, []);

  // Add item to cart with quantity
  const addItem = async (itemType: 'meal' | 'packet', itemId: string, quantity: number, markupPct: number) => {
    if (!cart) return;
    
    try {
      setIsLoading(true);
      
      // Add multiple items to cart based on quantity
      for (let i = 0; i < quantity; i++) {
        await addItemToCart({
          cart_id: cart.id,
          item_type: itemType,
          item_id: itemId,
          markup_pct: markupPct
        });
      }
      
      // Refresh cart data
      await loadCart();
    } catch (error) {
      console.error('Error adding item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart || newQuantity < 1) return;
    
    try {
      setIsLoading(true);
      
      // Find the cart item
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;
      
      const currentQuantity = cartItem.quantity;
      const difference = newQuantity - currentQuantity;
      
      if (difference > 0) {
        // Add more items
        for (let i = 0; i < difference; i++) {
          await addItemToCart({
            cart_id: cart.id,
            item_type: cartItem.item_type,
            item_id: cartItem.item_id,
            markup_pct: cartItem.markup_pct
          });
        }
      } else if (difference < 0) {
        // Remove items (simplified approach - in reality you'd need to track individual cart_item records)
        // For now, we'll update the local state and refresh
        cartItem.quantity = newQuantity;
        setCartItems([...cartItems]);
      }
      
      // Refresh cart data
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item markup
  const updateItemMarkup = async (itemId: string, markupPct: number) => {
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
      console.error('Error updating cart item markup:', error);
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

  // Refresh cart data
  const refreshCart = async () => {
    await loadCart();
  };

  const value: CartContextState = {
    cart,
    cartItems,
    isLoading,
    cartSummary,
    addItem,
    updateItemQuantity,
    updateItemMarkup,
    removeItem,
    finalizeCurrentCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
