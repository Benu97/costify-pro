import type { Database } from './database.types';

/**
 * Type definitions for our event-costing app schema
 * These should match the database schema exactly
 */

// Basic table row types
export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  price_net: number;
  category?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
};

export type Meal = {
  id: string;
  name: string;
  description: string | null;
  price_net_override: number | null;
  created_at: string;
  owner_id: string;
};

export type Packet = {
  id: string;
  name: string;
  description: string | null;
  price_net_override: number | null;
  created_at: string;
  owner_id: string;
};

export type Cart = {
  id: string;
  created_at: string;
  owner_id: string;
  status: 'draft' | 'final';
};

export type CartItem = {
  id: string;
  cart_id: string;
  item_type: 'meal' | 'packet';
  item_id: string;
  markup_pct: number;
  created_at: string;
};

// Join table types
export type MealIngredient = {
  meal_id: string;
  ingredient_id: string;
  quantity: number;
};

export type PacketMeal = {
  packet_id: string;
  meal_id: string;
  quantity: number;
};

// Enhanced types for calculations
export type IngredientWithQuantity = Ingredient & { quantity: number };
export type MealWithQuantity = Meal & { quantity: number };
export type MealWithIngredients = Meal & { ingredients: IngredientWithQuantity[] };
export type PacketWithMeals = Packet & { meals: MealWithQuantity[] };
export type CartItemWithDetails = CartItem & { 
  details: (MealWithIngredients | PacketWithMeals);
};

// Cart summary type
export type CartSummary = {
  nettoTotal: number;
  bruttoTotal: number;
  avgMarkupPct: number;
};

/**
 * Calculates the net price of a meal based on its ingredients
 * If price_net_override is set, uses that instead
 * 
 * @param meal The meal to calculate the price for
 * @param ingredientsWithQty The ingredients with quantities for this meal
 * @returns The net price of the meal
 */
export function calcMealNet<
  T extends Meal,
  U extends IngredientWithQuantity[] | any[]
>(meal: T, ingredientsWithQty: U): number {
  // If a price override exists, use that instead of calculating
  if (meal.price_net_override !== null && meal.price_net_override >= 0) {
    return meal.price_net_override;
  }
  
  // Calculate based on ingredients (default to empty array if undefined)
  const ingredients = ingredientsWithQty || [];
  return ingredients.reduce((total, ingredient) => {
    // Validate ingredient has required properties and positive values
    if (!ingredient || typeof ingredient.price_net !== 'number' || typeof ingredient.quantity !== 'number') {
      console.warn('Invalid ingredient data found:', ingredient);
      return total;
    }
    
    // Ensure no negative values
    const price = Math.max(0, ingredient.price_net);
    const quantity = Math.max(0, ingredient.quantity);
    
    return total + (price * quantity);
  }, 0);
}

/**
 * Calculates the gross price of a meal with markup
 * 
 * @param mealNet The net price of the meal
 * @param markupPct The markup percentage
 * @returns The gross price with markup applied
 */
export function calcMealGross(mealNet: number, markupPct: number): number {
  return mealNet * (1 + markupPct / 100);
}

/**
 * Calculates the net price of a packet based on its meals
 * If price_net_override is set, uses that instead
 * 
 * @param packet The packet to calculate the price for
 * @param mealsWithQty The meals with quantities for this packet
 * @returns The net price of the packet
 */
export function calcPacketNet<
  T extends Packet,
  U extends Array<any>
>(packet: T, mealsWithQty: U): number {
  // If a price override exists, use that instead of calculating
  if (packet.price_net_override !== null && packet.price_net_override >= 0) {
    return packet.price_net_override;
  }
  
  // Calculate based on meals
  return mealsWithQty.reduce((total, mealWithDetails) => {
    // Validate meal has required properties
    if (!mealWithDetails || typeof mealWithDetails.quantity !== 'number') {
      console.warn('Invalid meal data found:', mealWithDetails);
      return total;
    }
    
    // Ensure the meal has ingredients, default to empty array if not
    const ingredients = mealWithDetails.ingredients || [];
    const mealNet = calcMealNet(mealWithDetails, ingredients);
    const quantity = Math.max(0, mealWithDetails.quantity);
    
    return total + (mealNet * quantity);
  }, 0);
}

/**
 * Calculates the gross price of a packet with markup
 * 
 * @param packetNet The net price of the packet
 * @param markupPct The markup percentage
 * @returns The gross price with markup applied
 */
export function calcPacketGross(packetNet: number, markupPct: number): number {
  return packetNet * (1 + markupPct / 100);
}

/**
 * Calculates the summary of a cart including totals and average markup
 * 
 * @param cartItems The cart items with their details
 * @returns Cart summary with netto total, brutto total, and average markup
 */
export function calcCartSummary<T extends CartItemWithDetails[]>(
  cartItems: T
): CartSummary {
  let nettoTotal = 0;
  let bruttoTotal = 0;
  let weightedMarkupSum = 0;
  
  cartItems.forEach(item => {
    let itemNet = 0;
    
    if (item.item_type === 'meal') {
      const mealWithIngredients = item.details as MealWithIngredients;
      itemNet = calcMealNet(mealWithIngredients, mealWithIngredients.ingredients);
    } else {
      const packetWithMeals = item.details as PacketWithMeals;
      itemNet = calcPacketNet(packetWithMeals, packetWithMeals.meals as any);
    }
    
    const itemGross = itemNet * (1 + item.markup_pct / 100);
    
    nettoTotal += itemNet;
    bruttoTotal += itemGross;
    weightedMarkupSum += item.markup_pct * itemNet;
  });
  
  // Calculate weighted average markup percentage
  const avgMarkupPct = nettoTotal > 0 ? weightedMarkupSum / nettoTotal : 0;
  
  return {
    nettoTotal,
    bruttoTotal,
    avgMarkupPct
  };
}
