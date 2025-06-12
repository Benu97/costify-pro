import { Meal, Packet, calcMealNet, calcPacketNet, IngredientWithQuantity, MealWithIngredients } from './pricing';

/**
 * Calculates the display price for a meal
 * Uses override price if available, otherwise calculates from ingredients
 * For demo purposes, returns a default price if ingredients are not available
 */
export function calculateMealPrice(meal: Meal, ingredients?: IngredientWithQuantity[]): number {
  // If there's an override price, use it
  if (meal.price_net_override !== null && meal.price_net_override !== undefined) {
    return meal.price_net_override;
  }
  
  // If ingredients are provided, calculate from them
  if (ingredients && ingredients.length > 0) {
    return calcMealNet(meal, ingredients);
  }
  
  // For demo purposes, return a default price
  // In a real app, you'd fetch the ingredients for this meal
  return 0;
}

/**
 * Gets a display-friendly price string for a meal
 * Shows override price, calculated price, or a helpful message
 */
export function getMealPriceDisplay(meal: Meal, ingredients?: IngredientWithQuantity[]): string {
  // Handle null and undefined - treat 0 as a valid override
  const override = meal.price_net_override;
  const hasValidOverride = override !== null && override !== undefined && typeof override === 'number';
  
  // If there's a valid override price (including 0), use it
  if (hasValidOverride) {
    return `€${override.toFixed(2)}`;
  }
  
  // If ingredients are provided, calculate from them
  if (ingredients && ingredients.length > 0) {
    const calculatedPrice = calcMealNet(meal, ingredients);
    return `€${calculatedPrice.toFixed(2)}`;
  }
  
  // No price available
  return 'Add ingredients';
}

/**
 * Calculates the display price for a packet
 * Uses override price if available, otherwise calculates from meals
 * For demo purposes, returns a default price if meals are not available
 */
export function calculatePacketPrice(packet: Packet, meals?: Array<any>): number {
  // Handle null and undefined - treat 0 as a valid override
  const override = packet.price_net_override;
  const hasValidOverride = override !== null && override !== undefined && typeof override === 'number';
  
  // If there's a valid override price (including 0), use it
  if (hasValidOverride) {
    return override;
  }
  
  // If meals are provided, calculate from them
  if (meals && meals.length > 0) {
    return calcPacketNet(packet, meals as any);
  }
  
  // For demo purposes, return a default price
  // In a real app, you'd fetch the meals for this packet
  return 0;
}

/**
 * Gets a display-friendly price string for a packet
 * Shows override price, calculated price, or a helpful message
 */
export function getPacketPriceDisplay(packet: Packet, meals?: Array<any>): string {
  // Handle null and undefined - treat 0 as a valid override  
  const override = packet.price_net_override;
  const hasValidOverride = override !== null && override !== undefined && typeof override === 'number';
  
  // If there's a valid override price (including 0), use it
  if (hasValidOverride) {
    return `€${override.toFixed(2)}`;
  }
  
  // If meals are provided, calculate from them
  if (meals && meals.length > 0) {
    const calculatedPrice = calcPacketNet(packet, meals as any);
    return `€${calculatedPrice.toFixed(2)}`;
  }
  
  // No price available
  return 'Add meals';
}

/**
 * Formats a price for display with currency symbol
 */
export function formatPrice(price: number, currency: string = '€'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Calculates price with markup
 */
export function calculatePriceWithMarkup(basePrice: number, markupPercentage: number): number {
  return basePrice * (1 + markupPercentage / 100);
}

/**
 * Calculates VAT amount
 */
export function calculateVAT(netPrice: number, vatRate: number = 19): number {
  return netPrice * (vatRate / 100);
}

/**
 * Calculates gross price (net + VAT)
 */
export function calculateGrossPrice(netPrice: number, vatRate: number = 19): number {
  return netPrice * (1 + vatRate / 100);
} 