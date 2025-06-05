'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Cart, CartItem, calcCartSummary } from '@/app/lib/pricing';
import { 
  getCurrentDraftCart, 
  getCartItems, 
  addItemToCart, 
  updateCartItem, 
  removeCartItem, 
  finalizeCart,
  addMultipleItemsToCart,
  getCartItemsOptimized,
  removeMultipleCartItems,
  updateMultipleCartItemsMarkup
} from '@/app/actions/cart';
import { useRouter } from 'next/navigation';

// Define the cart item type with more details for UI
export interface DetailedCartItem extends CartItem {
  details: any; // The full meal or packet details
  netPrice: number;
  grossPrice: number;
  quantity: number; // Add quantity to cart items
  individualIds?: string[]; // Store individual DB IDs for batch operations
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

  // Load the current draft cart (optimized)
  const loadCart = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const currentCart = await getCurrentDraftCart();
      setCart(currentCart);
      
      if (currentCart) {
        // Use optimized cart items fetch
        const items = await getCartItemsOptimized(currentCart.id);
        
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
            // Store individual IDs for batch operations
            if (!existingItem.individualIds) {
              existingItem.individualIds = [existingItem.id];
            }
            existingItem.individualIds.push(item.id);
          } else {
            // New item - use a unique ID for the grouped item
            const groupedItemId = `grouped_${item.item_id}_${item.markup_pct}`;
            groupedItems.set(key, {
              ...item,
              id: groupedItemId, // Use a consistent ID for grouped items
              netPrice,
              grossPrice,
              markup_pct: item.markup_pct || 0,
              quantity: 1,
              individualIds: [item.id] // Store individual DB IDs for operations
            } as DetailedCartItem & { individualIds: string[] });
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
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Add item to cart with quantity (optimized)
  const addItem = async (itemType: 'meal' | 'packet', itemId: string, quantity: number, markupPct: number) => {
    if (!cart) return;
    
    try {
      // Optimistic update - add to UI immediately
      const tempId = `temp_${Date.now()}`;
      const netPrice = 10; // This should be calculated properly
      const grossPrice = netPrice * (1 + markupPct / 100);
      
      const optimisticItem: DetailedCartItem = {
        id: `grouped_${itemId}_${markupPct}`,
        cart_id: cart.id,
        item_type: itemType,
        item_id: itemId,
        markup_pct: markupPct,
        created_at: new Date().toISOString(),
        details: { name: 'Loading...' }, // Placeholder
        netPrice,
        grossPrice,
        quantity,
        individualIds: []
      };

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item => 
        item.item_id === itemId && item.markup_pct === markupPct
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity optimistically
        setCartItems(prev => 
          prev.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        // Add new item optimistically
        setCartItems(prev => [...prev, optimisticItem]);
      }

      // Make API call in background
      await addMultipleItemsToCart({
        cart_id: cart.id,
        item_type: itemType,
        item_id: itemId,
        markup_pct: markupPct,
        quantity
      });
      
      // Refresh cart data silently to get correct data
      await loadCart(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // Revert optimistic update by reloading
      await loadCart();
    }
  };

  // Update cart item quantity (optimized)
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart || newQuantity < 1 || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Find the cart item in our local state
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;

      const currentQuantity = cartItem.quantity;
      const difference = newQuantity - currentQuantity;

      // Optimistic update
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );

      if (difference > 0) {
        // Add more items to the database
        await addMultipleItemsToCart({
          cart_id: cart.id,
          item_type: cartItem.item_type,
          item_id: cartItem.item_id,
          markup_pct: cartItem.markup_pct,
          quantity: difference
        });
      } else if (difference < 0) {
        // Remove excess items from the database
        const itemsToRemove = (cartItem as any).individualIds?.slice(0, Math.abs(difference)) || [];
        if (itemsToRemove.length > 0) {
          await removeMultipleCartItems(itemsToRemove);
        }
      }
      
      // Refresh cart data silently to sync
      await loadCart(true);
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      // Revert optimistic update
      await loadCart();
    } finally {
      setIsUpdating(false);
    }
  };

  // Update cart item markup (optimized)
  const updateItemMarkup = async (itemId: string, markupPct: number) => {
    if (!cart || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Find the cart item in our local state
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;

      // Optimistic update
      const newGrossPrice = cartItem.netPrice * (1 + markupPct / 100);
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, markup_pct: markupPct, grossPrice: newGrossPrice }
            : item
        )
      );

      // Update all individual items with new markup
      const individualIds = (cartItem as any).individualIds || [];
      const updates = individualIds.map((id: string) => ({ id, markup_pct: markupPct }));
      
      if (updates.length > 0) {
        await updateMultipleCartItemsMarkup(updates);
      }
      
      // Refresh cart data silently to sync
      await loadCart(true);
    } catch (error) {
      console.error('Error updating cart item markup:', error);
      // Revert optimistic update
      await loadCart();
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove item from cart (optimized)
  const removeItem = async (itemId: string) => {
    if (!cart || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Find the cart item in our local state
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) return;

      // Optimistic update - remove from UI immediately
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

      // Remove all individual items from the database
      const individualIds = (cartItem as any).individualIds || [];
      if (individualIds.length > 0) {
        await removeMultipleCartItems(individualIds);
      }
      
    } catch (error) {
      console.error('Error removing cart item:', error);
      // Revert by reloading from database
      await loadCart();
    } finally {
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
