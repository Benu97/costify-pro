'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase-server-utils';
import { packetSchema, type PacketFormValues } from '../lib/validation-schemas';

// Get all packets
export async function getPackets() {
  const supabase = createServerClient();
  
  const { data: packets, error } = await supabase
    .from('packets')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching packets:', error.message);
    throw new Error('Failed to fetch packets');
  }

  return packets;
}

// Get all packets with meals for dashboard display
export async function getPacketsWithMeals() {
  const supabase = createServerClient();
  
  // First get all packets
  const { data: packets, error: packetsError } = await supabase
    .from('packets')
    .select('*')
    .order('name');

  if (packetsError) {
    console.error('Error fetching packets:', packetsError.message);
    throw new Error(`Failed to fetch packets: ${packetsError.message}`);
  }

  // Then get meals for each packet
  const packetsWithMeals = await Promise.all(
    packets.map(async (packet) => {
      const { data: packetMeals, error: mealsError } = await supabase
        .from('packet_meals')
        .select(`
          meal_id,
          quantity,
          meals (
            id,
            name,
            description,
            price_net_override,
            meal_ingredients (
              quantity,
              ingredients (
                id,
                name,
                unit,
                price_net,
                category,
                created_at,
                updated_at,
                owner_id
              )
            )
          )
        `)
        .eq('packet_id', packet.id);

      if (mealsError) {
        console.error(`Error fetching meals for packet ${packet.id}:`, mealsError.message);
        // Return packet without meals if there's an error (e.g., orphaned references)
        return { ...packet, meals: [] };
      }

      // Filter out any null meals (in case of orphaned packet_meals records)
      const validMeals = packetMeals.filter(pm => pm.meals !== null);

      return {
        ...packet,
        meals: validMeals.map(pm => ({
          ...(pm.meals as any),
          quantity: pm.quantity,
          ingredients: pm.meals?.meal_ingredients?.map(mi => ({
            ...(mi.ingredients as any),
            quantity: mi.quantity
          })) || []
        }))
      };
    })
  );

  return packetsWithMeals;
}

// Create a new packet
export const createPacket = withAuth(async (formData: PacketFormValues) => {
  const validated = packetSchema.parse(formData);
  
  // Get authenticated user (withAuth ensures user exists)
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabaseAdmin
    .from('packets')
    .insert({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
      owner_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating packet:', error.message);
    throw new Error(`Failed to create packet: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Update an existing packet
export const updatePacket = withAuth(async (formData: PacketFormValues) => {
  if (!formData.id) {
    throw new Error('Packet ID is required for updates');
  }

  const validated = packetSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('packets')
    .update({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating packet:', error.message);
    throw new Error(`Failed to update packet: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Delete a packet
export const deletePacket = withAuth(async (id: string) => {
  // First delete all packet_meals relationships
  const { error: packetMealsError } = await supabaseAdmin
    .from('packet_meals')
    .delete()
    .eq('packet_id', id);

  if (packetMealsError) {
    console.error('Error deleting packet meals:', packetMealsError.message);
    throw new Error(`Failed to delete packet meals: ${packetMealsError.message}`);
  }

  // Then delete the packet itself
  const { error } = await supabaseAdmin
    .from('packets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting packet:', error.message);
    throw new Error(`Failed to delete packet: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true };
});

// Get packet with meals
export async function getPacketWithMeals(packetId: string) {
  const supabase = createServerClient();
  
  const { data: packet, error: packetError } = await supabase
    .from('packets')
    .select('*')
    .eq('id', packetId)
    .single();

  if (packetError) {
    console.error('Error fetching packet:', packetError.message);
    throw new Error('Failed to fetch packet');
  }

  const { data: packetMeals, error: mealsError } = await supabase
    .from('packet_meals')
    .select(`
      meal_id,
      quantity,
      meals (
        id,
        name,
        description,
        price_net_override,
        meal_ingredients (
          quantity,
          ingredients (
            id,
            name,
            unit,
            price_net,
            category,
            created_at,
            updated_at,
            owner_id
          )
        )
      )
    `)
    .eq('packet_id', packetId);

  if (mealsError) {
    console.error('Error fetching packet meals:', mealsError.message);
    throw new Error('Failed to fetch packet meals');
  }

  return {
    ...packet,
    meals: packetMeals.map(pm => ({
      ...(pm.meals as any),
      quantity: pm.quantity,
      ingredients: pm.meals?.meal_ingredients?.map(mi => ({
        ...(mi.ingredients as any),
        quantity: mi.quantity
      })) || []
    }))
  };
}

// Add meal to packet
export const addPacketMeal = withAuth(async (packetId: string, mealId: string, quantity: number) => {
  const { data, error } = await supabaseAdmin
    .from('packet_meals')
    .insert({
      packet_id: packetId,
      meal_id: mealId,
      quantity: quantity
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding meal to packet:', error.message);
    throw new Error(`Failed to add meal to packet: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Update packet meal quantity
export const updatePacketMeal = withAuth(async (packetId: string, mealId: string, quantity: number) => {
  const { data, error } = await supabaseAdmin
    .from('packet_meals')
    .update({ quantity })
    .eq('packet_id', packetId)
    .eq('meal_id', mealId)
    .select()
    .single();

  if (error) {
    console.error('Error updating packet meal:', error.message);
    throw new Error(`Failed to update meal quantity: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Remove meal from packet
export const removePacketMeal = withAuth(async (packetId: string, mealId: string) => {
  const { error } = await supabaseAdmin
    .from('packet_meals')
    .delete()
    .eq('packet_id', packetId)
    .eq('meal_id', mealId);

  if (error) {
    console.error('Error removing meal from packet:', error.message);
    throw new Error(`Failed to remove meal from packet: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true };
});

// Remove price override from packet
export const removePacketPriceOverride = withAuth(async (packetId: string) => {
  const { data, error } = await supabaseAdmin
    .from('packets')
    .update({ 
      price_net_override: null 
    })
    .eq('id', packetId)
    .select()
    .single();

  if (error) {
    console.error('Error removing packet price override:', error.message);
    throw new Error(`Failed to remove packet price override: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
}); 