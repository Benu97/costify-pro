'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase';

// Validation schema
export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  price_net: z.coerce.number().min(0, 'Price must be a positive number'),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

// Get all ingredients for the current user
export async function getIngredients() {
  const supabase = createServerClient();
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching ingredients:', error.message);
    throw new Error('Failed to fetch ingredients');
  }

  return ingredients;
}

// Create a new ingredient
export const createIngredient = withAuth(async (formData: IngredientFormValues) => {
  const validated = ingredientSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .insert({
      name: validated.name,
      unit: validated.unit,
      price_net: validated.price_net,
      // The service role bypasses RLS, but we still need to set owner_id
      owner_id: (await createServerClient().auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ingredient:', error.message);
    throw new Error(`Failed to create ingredient: ${error.message}`);
  }

  revalidatePath('/dashboard/ingredients');
  return { success: true, data };
});

// Update an existing ingredient
export const updateIngredient = withAuth(async (formData: IngredientFormValues) => {
  if (!formData.id) {
    throw new Error('Ingredient ID is required for updates');
  }

  const validated = ingredientSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .update({
      name: validated.name,
      unit: validated.unit,
      price_net: validated.price_net,
    })
    .eq('id', validated.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ingredient:', error.message);
    throw new Error(`Failed to update ingredient: ${error.message}`);
  }

  revalidatePath('/dashboard/ingredients');
  return { success: true, data };
});

// Delete an ingredient
export const deleteIngredient = withAuth(async (id: string) => {
  const { error } = await supabaseAdmin
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ingredient:', error.message);
    throw new Error(`Failed to delete ingredient: ${error.message}`);
  }

  revalidatePath('/dashboard/ingredients');
  return { success: true };
});
