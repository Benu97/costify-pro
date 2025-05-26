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
  
  // Get authenticated user (withAuth ensures user exists)
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabaseAdmin
    .from('meals')
    .insert({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
      owner_id: user.id
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
    .eq('id', formData.id)
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

// Get meal with ingredients
export async function getMealWithIngredients(mealId: string) {
  const supabase = createServerClient();
  
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('*')
    .eq('id', mealId)
    .single();

  if (mealError) {
    console.error('Error fetching meal:', mealError.message);
    throw new Error('Failed to fetch meal');
  }

  const { data: mealIngredients, error: ingredientsError } = await supabase
    .from('meal_ingredients')
    .select(`
      ingredient_id,
      quantity,
      ingredients (
        id,
        name,
        unit,
        price_net,
        category
      )
    `)
    .eq('meal_id', mealId);

  if (ingredientsError) {
    console.error('Error fetching meal ingredients:', ingredientsError.message);
    throw new Error('Failed to fetch meal ingredients');
  }

  return {
    ...meal,
    ingredients: mealIngredients.map(mi => ({
      ...(mi.ingredients as any),
      quantity: mi.quantity
    }))
  };
}

// Add ingredient to meal
export const addMealIngredient = withAuth(async (mealId: string, ingredientId: string, quantity: number) => {
  const { data, error } = await supabaseAdmin
    .from('meal_ingredients')
    .insert({
      meal_id: mealId,
      ingredient_id: ingredientId,
      quantity: quantity
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding meal ingredient:', error.message);
    throw new Error(`Failed to add ingredient to meal: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true, data };
});

// Update meal ingredient quantity
export const updateMealIngredient = withAuth(async (mealId: string, ingredientId: string, quantity: number) => {
  const { data, error } = await supabaseAdmin
    .from('meal_ingredients')
    .update({ quantity })
    .eq('meal_id', mealId)
    .eq('ingredient_id', ingredientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating meal ingredient:', error.message);
    throw new Error(`Failed to update ingredient quantity: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true, data };
});

// Remove ingredient from meal
export const removeMealIngredient = withAuth(async (mealId: string, ingredientId: string) => {
  const { error } = await supabaseAdmin
    .from('meal_ingredients')
    .delete()
    .eq('meal_id', mealId)
    .eq('ingredient_id', ingredientId);

  if (error) {
    console.error('Error removing meal ingredient:', error.message);
    throw new Error(`Failed to remove ingredient from meal: ${error.message}`);
  }

  revalidatePath('/dashboard/meals');
  return { success: true };
});
