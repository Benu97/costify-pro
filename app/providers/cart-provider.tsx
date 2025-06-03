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
  const [isUpdating, setIsUpdating] = useState(false); // Prevent concurrent operations

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
            // New item - use a unique ID for the grouped item
            const groupedItemId = `grouped_${item.item_id}_${item.markup_pct}`;
            groupedItems.set(key, {
              ...item,
              id: groupedItemId, // Use a consistent ID for grouped items
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
    if (!cart || newQuantity < 1 || isUpdating) return;
    
    try {
      setIsUpdating(true);
      setIsLoading(true);
      
      // Find the cart item in our local state (itemId is the grouped ID)
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;
      
      const currentQuantity = cartItem.quantity;
      const difference = newQuantity - currentQuantity;
      
      if (difference > 0) {
        // Add more items to the database
        for (let i = 0; i < difference; i++) {
          await addItemToCart({
            cart_id: cart.id,
            item_type: cartItem.item_type,
            item_id: cartItem.item_id,
            markup_pct: cartItem.markup_pct
          });
        }
      } else if (difference < 0) {
        // We need to remove items from the database
        // Get all individual cart_item records for this grouped item
        const allCartItems = await getCartItems(cart.id);
        const matchingItems = allCartItems.filter(item => 
          item.item_id === cartItem.item_id && 
          item.markup_pct === cartItem.markup_pct
        );
        
        // Remove the excess items (absolute value of difference)
        const itemsToRemove = matchingItems.slice(0, Math.abs(difference));
        for (const itemToRemove of itemsToRemove) {
          await removeCartItem(itemToRemove.id);
        }
      }
      
      // Refresh cart data to get the updated state
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      // Revert local state by reloading from database
      await loadCart();
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Update cart item markup
  const updateItemMarkup = async (itemId: string, markupPct: number) => {
    if (!cart || isUpdating) return;
    
    try {
      setIsUpdating(true);
      setIsLoading(true);
      
      // Find the cart item in our local state (itemId is the grouped ID)
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;
      
      // Get all individual cart_item records for this grouped item
      const allCartItems = await getCartItems(cart.id);
      const matchingItems = allCartItems.filter(item => 
        item.item_id === cartItem.item_id && 
        item.markup_pct === cartItem.markup_pct
      );
      
             // Update all matching items to have the new markup
       for (const item of matchingItems) {
         await updateCartItem({
           id: item.id,
           cart_id: cart.id,
           item_type: item.item_type as 'meal' | 'packet',
           item_id: item.item_id,
           markup_pct: markupPct
         });
       }
      
      // Refresh cart data
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item markup:', error);
      // Revert by reloading from database
      await loadCart();
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!cart || isUpdating) return;
    
    try {
      setIsUpdating(true);
      setIsLoading(true);
      
      // Find the cart item in our local state (itemId is the grouped ID)
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;
      
      // Get all individual cart_item records for this grouped item
      const allCartItems = await getCartItems(cart.id);
      const matchingItems = allCartItems.filter(item => 
        item.item_id === cartItem.item_id && 
        item.markup_pct === cartItem.markup_pct
      );
      
      // Remove ALL matching items from the database
      for (const item of matchingItems) {
        await removeCartItem(item.id);
      }
      
      // Update local state immediately to prevent flickering
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
    } catch (error) {
      console.error('Error removing cart item:', error);
      // Revert by reloading from database
      await loadCart();
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
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
