import { z } from 'zod';

// Ingredient validation schema
export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  price_net: z.coerce.number().min(0, 'Price must be a positive number'),
  category: z.string().optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

// Meal validation schema
export const mealSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price_net_override: z.preprocess(
    (val) => {
      // Convert empty string to null, otherwise attempt to coerce to number
      if (val === '' || val === undefined) return null;
      return val;
    },
    z.coerce.number().min(0, 'Price must be a positive number').optional().nullable()
  ),
});

export type MealFormValues = z.infer<typeof mealSchema>;

// Packet validation schema
export const packetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price_net_override: z.preprocess(
    (val) => {
      // Convert empty string to null, otherwise attempt to coerce to number
      if (val === '' || val === undefined) return null;
      return val;
    },
    z.coerce.number().min(0, 'Price must be a positive number').optional().nullable()
  ),
});

export type PacketFormValues = z.infer<typeof packetSchema>;

// Cart item validation schema
export const cartItemSchema = z.object({
  id: z.string().optional(),
  cart_id: z.string(),
  item_type: z.enum(['meal', 'packet']),
  item_id: z.string(),
  markup_pct: z.coerce.number().min(0).default(0),
});

// Cart item with quantity for batch operations
export const cartItemBatchSchema = cartItemSchema.extend({
  quantity: z.coerce.number().min(1).default(1),
});

export type CartItemFormValues = z.infer<typeof cartItemSchema>;
export type CartItemBatchFormValues = z.infer<typeof cartItemBatchSchema>;
