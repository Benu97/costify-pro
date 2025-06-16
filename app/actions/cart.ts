'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase-server-utils';
import { Cart, CartItem } from '../lib/pricing';
import { cartItemSchema, cartItemBatchSchema, type CartItemFormValues, type CartItemBatchFormValues } from '../lib/validation-schemas';

// Get current draft cart or create one if none exists
export const getCurrentDraftCart = withAuth(async () => {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check for existing draft cart
  const { data: existingCarts, error: fetchError } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching cart:', fetchError);
    throw new Error('Failed to fetch cart');
  }

  // If draft cart exists, return it
  if (existingCarts && existingCarts.length > 0) {
    return existingCarts[0] as Cart;
  }

  // Otherwise create a new draft cart
  const { data: newCart, error: createError } = await supabaseAdmin
    .from('carts')
    .insert({
      owner_id: user.id,
      status: 'draft'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating cart:', createError);
    throw new Error('Failed to create cart');
  }

  return newCart as Cart;
});

// Get cart items with details
export const getCartItems = withAuth(async (cartId: string) => {
  const { data: cartItems, error: itemsError } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at');

  if (itemsError) {
    console.error('Error fetching cart items:', itemsError);
    throw new Error('Failed to fetch cart items');
  }

  // Get details for each item
  const enhancedItems = await Promise.all(
    cartItems.map(async (item) => {
      if (item.item_type === 'meal') {
        const { data: meal } = await supabaseAdmin
          .from('meals')
          .select('*, meal_ingredients(*, ingredients(*))')
          .eq('id', item.item_id)
          .single();
        
        return {
          ...item,
          details: meal
        };
      } else if (item.item_type === 'packet') {
        const { data: packet } = await supabaseAdmin
          .from('packets')
          .select('*, packet_meals(*, meals(*, meal_ingredients(*, ingredients(*))))')
          .eq('id', item.item_id)
          .single();
        
        return {
          ...item,
          details: packet
        };
      } else if (item.item_type === 'service') {
        const { data: service } = await supabaseAdmin
          .from('services')
          .select('*')
          .eq('id', item.item_id)
          .single();
        
        return {
          ...item,
          details: service
        };
      } else {
        // Fallback for unknown item types
        return {
          ...item,
          details: null
        };
      }
    })
  );

  return enhancedItems;
});

// Add an item to cart
export const addItemToCart = withAuth(async (formData: CartItemFormValues) => {
  const validated = cartItemSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert({
      cart_id: validated.cart_id,
      item_type: validated.item_type,
      item_id: validated.item_id,
      markup_pct: validated.markup_pct,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding item to cart:', error);
    throw new Error(`Failed to add item to cart: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Update cart item
export const updateCartItem = withAuth(async (formData: CartItemFormValues) => {
  if (!formData.id) {
    throw new Error('Cart item ID is required for updates');
  }

  const validated = cartItemSchema.parse(formData);
  
  // TypeScript fix: Use formData.id directly since we already checked it exists
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({
      markup_pct: validated.markup_pct,
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cart item:', error);
    throw new Error(`Failed to update cart item: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Remove item from cart
export const removeCartItem = withAuth(async (id: string) => {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing cart item:', error);
    throw new Error(`Failed to remove cart item: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true };
});

// Finalize cart and create a new draft
export const finalizeCart = withAuth(async (cartId: string) => {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Update cart status to final
  const { error: updateError } = await supabaseAdmin
    .from('carts')
    .update({ status: 'final' })
    .eq('id', cartId);

  if (updateError) {
    console.error('Error finalizing cart:', updateError);
    throw new Error(`Failed to finalize cart: ${updateError.message}`);
  }

  // Create a new draft cart
  const { data: newCart, error: createError } = await supabaseAdmin
    .from('carts')
    .insert({
      owner_id: user.id,
      status: 'draft'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating new draft cart:', createError);
    throw new Error('Failed to create new draft cart');
  }

  revalidatePath('/');
  return { success: true, newCartId: newCart.id };
});

// Search meals, packets, and services for adding to cart
export const searchItems = withAuth(async (query: string) => {
  const supabase = createServerClient();
  
  // Search meals
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('id, name, description')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(5);

  if (mealsError) {
    console.error('Error searching meals:', mealsError);
  }

  // Search packets
  const { data: packets, error: packetsError } = await supabase
    .from('packets')
    .select('id, name, description')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(5);

  if (packetsError) {
    console.error('Error searching packets:', packetsError);
  }

  // Search services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, description')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(5);

  if (servicesError) {
    console.error('Error searching services:', servicesError);
  }

  return {
    meals: meals || [],
    packets: packets || [],
    services: services || []
  };
});

// Add multiple items to cart efficiently (batch operation)
export const addMultipleItemsToCart = withAuth(async (formData: CartItemBatchFormValues) => {
  const validated = cartItemBatchSchema.parse(formData);
  const { quantity, ...itemData } = formData;
  
  // Create array of items to insert
  const itemsToInsert = Array(quantity).fill(null).map(() => ({
    cart_id: validated.cart_id,
    item_type: validated.item_type,
    item_id: validated.item_id,
    markup_pct: validated.markup_pct,
  }));

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('Error adding items to cart:', error);
    throw new Error(`Failed to add items to cart: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Get cart items with details (optimized with joins)
export const getCartItemsOptimized = withAuth(async (cartId: string) => {
  // Get all cart items first
  const { data: cartItems, error: itemsError } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at');

  if (itemsError) {
    console.error('Error fetching cart items:', itemsError);
    throw new Error('Failed to fetch cart items');
  }

  if (!cartItems || cartItems.length === 0) {
    return [];
  }

  // Group items by type to reduce queries
  const mealIds = cartItems
    .filter(item => item.item_type === 'meal')
    .map(item => item.item_id);
  
  const packetIds = cartItems
    .filter(item => item.item_type === 'packet')
    .map(item => item.item_id);
    
  const serviceIds = cartItems
    .filter(item => item.item_type === 'service')
    .map(item => item.item_id);

  // Fetch all meals, packets, and services in batches
  const [mealsData, packetsData, servicesData] = await Promise.all([
    mealIds.length > 0 
      ? supabaseAdmin
          .from('meals')
          .select('*, meal_ingredients(*, ingredients(*))')
          .in('id', mealIds)
      : { data: [] },
    
    packetIds.length > 0
      ? supabaseAdmin
          .from('packets')
          .select('*, packet_meals(*, meals(*, meal_ingredients(*, ingredients(*))))')
          .in('id', packetIds)
      : { data: [] },
      
    serviceIds.length > 0
      ? supabaseAdmin
          .from('services')
          .select('*')
          .in('id', serviceIds)
      : { data: [] }
  ]);

  // Create lookup maps for efficient access
  const mealsMap = new Map((mealsData.data || []).map(meal => [meal.id, meal]));
  const packetsMap = new Map((packetsData.data || []).map(packet => [packet.id, packet]));
  const servicesMap = new Map((servicesData.data || []).map(service => [service.id, service]));

  // Enhance cart items with details
  const enhancedItems = cartItems.map(item => ({
    ...item,
    details: item.item_type === 'meal' 
      ? mealsMap.get(item.item_id)
      : item.item_type === 'packet'
      ? packetsMap.get(item.item_id)
      : servicesMap.get(item.item_id)
  }));

  return enhancedItems;
});

// Bulk remove cart items
export const removeMultipleCartItems = withAuth(async (itemIds: string[]) => {
  if (itemIds.length === 0) return { success: true };

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .in('id', itemIds);

  if (error) {
    console.error('Error removing cart items:', error);
    throw new Error(`Failed to remove cart items: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true };
});

// Update multiple cart items markup at once
export const updateMultipleCartItemsMarkup = withAuth(async (updates: Array<{ id: string; markup_pct: number }>) => {
  if (updates.length === 0) return { success: true };

  // Use Promise.all for concurrent updates
  const updatePromises = updates.map(update => 
    supabaseAdmin
      .from('cart_items')
      .update({ markup_pct: update.markup_pct })
      .eq('id', update.id)
  );

  const results = await Promise.all(updatePromises);
  
  // Check for any errors
  const errors = results.filter(result => result.error);
  if (errors.length > 0) {
    console.error('Error updating cart items:', errors);
    throw new Error('Failed to update some cart items');
  }

  revalidatePath('/');
  return { success: true };
});
