'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase-server-utils';
import { mealSchema, type MealFormValues } from '../lib/validation-schemas';

// Get all meals for the current user
export async function getMeals() {
  const supabase = createServerClient();
  const { data: meals, error } = await supabase
    .from('meals')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching meals:', error.message);
    throw new Error('Failed to fetch meals');
  }

  return meals;
}

// Create a new meal
export const createMeal = withAuth(async (formData: MealFormValues) => {
  const validated = mealSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('meals')
    .insert({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
      owner_id: (await createServerClient().auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating meal:', error.message);
    throw new Error(`Failed to create meal: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true, data };
});

// Update an existing meal
export const updateMeal = withAuth(async (formData: MealFormValues) => {
  if (!formData.id) {
    throw new Error('Meal ID is required for updates');
  }

  const validated = mealSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('meals')
    .update({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
    })
    .eq('id', validated.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating meal:', error.message);
    throw new Error(`Failed to update meal: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true, data };
});

// Delete a meal
export const deleteMeal = withAuth(async (id: string) => {
  const { error } = await supabaseAdmin
    .from('meals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting meal:', error.message);
    throw new Error(`Failed to delete meal: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true };
});
