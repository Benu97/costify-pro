'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';
import { MealFormValues, mealSchema } from '@/app/lib/validation-schemas';
import { Meal, Ingredient, IngredientWithQuantity } from '@/app/lib/pricing';
import { calcMealNet } from '@/app/lib/pricing';
import { 
  getMealWithIngredients, 
  updateMeal, 
  addMealIngredient, 
  updateMealIngredient, 
  removeMealIngredient,
  removeMealPriceOverride
} from '@/app/actions/meals';
import { getIngredients } from '@/app/actions/ingredients';
import { toast } from 'sonner';

interface MealDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealId: string | null;
  onMealUpdated?: (meal: Meal) => void;
}

interface MealWithIngredients extends Meal {
  ingredients: IngredientWithQuantity[];
}

export function MealDetailsDialog({
  open,
  onOpenChange,
  mealId,
  onMealUpdated
}: MealDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meal, setMeal] = useState<MealWithIngredients | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(1);

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      name: '',
      description: '',
      price_net_override: null,
    },
  });

  // Load meal data when dialog opens
  useEffect(() => {
    if (open && mealId) {
      loadMealData();
      loadAvailableIngredients();
    }
  }, [open, mealId]);

  // Update form when meal data changes
  useEffect(() => {
    if (meal) {
      form.reset({
        id: meal.id,
        name: meal.name,
        description: meal.description,
        price_net_override: meal.price_net_override,
      });
    }
  }, [meal, form]);

  const loadMealData = async () => {
    if (!mealId) return;
    
    setIsLoading(true);
    try {
      const mealData = await getMealWithIngredients(mealId);
      setMeal(mealData as MealWithIngredients);
    } catch (error) {
      console.error('Failed to load meal:', error);
      toast.error('Failed to load meal details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableIngredients = async () => {
    try {
      const ingredients = await getIngredients();
      setAvailableIngredients(ingredients as Ingredient[]);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const handleSaveMeal = async (data: MealFormValues) => {
    if (!meal) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateMeal(data);
      if (result.success && result.data) {
        const updatedMeal = { ...meal, ...result.data };
        setMeal(updatedMeal as MealWithIngredients);
        if (onMealUpdated) {
          onMealUpdated(result.data as Meal);
        }
        toast.success('Meal updated successfully');
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error('Failed to update meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!meal || !selectedIngredientId || ingredientQuantity <= 0) return;

    try {
      await addMealIngredient(meal.id, selectedIngredientId, ingredientQuantity);
      await loadMealData(); // Reload to get updated data
      setSelectedIngredientId('');
      setIngredientQuantity(1);
      toast.success('Ingredient added to meal');
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      toast.error('Failed to add ingredient');
    }
  };

  const handleUpdateIngredientQuantity = async (ingredientId: string, newQuantity: number) => {
    if (!meal || newQuantity <= 0) return;

    try {
      await updateMealIngredient(meal.id, ingredientId, newQuantity);
      await loadMealData(); // Reload to get updated data
      toast.success('Ingredient quantity updated');
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      toast.error('Failed to update ingredient');
    }
  };

  const handleRemoveIngredient = async (ingredientId: string) => {
    if (!meal) return;

    try {
      await removeMealIngredient(meal.id, ingredientId);
      await loadMealData(); // Reload to get updated data
      toast.success('Ingredient removed from meal');
    } catch (error) {
      console.error('Failed to remove ingredient:', error);
      toast.error('Failed to remove ingredient');
    }
  };

  const handleRemovePriceOverride = async () => {
    if (!meal) return;
    
    setIsSubmitting(true);
    try {
      const result = await removeMealPriceOverride(meal.id);
      if (result.success && result.data) {
        const updatedMeal = { ...meal, price_net_override: null };
        setMeal(updatedMeal as MealWithIngredients);
        // Update the form to reflect the change
        form.setValue('price_net_override', null);
        if (onMealUpdated) {
          onMealUpdated(result.data as Meal);
        }
        toast.success('Price override removed - meal will now calculate from ingredients');
      }
    } catch (error) {
      console.error('Failed to remove price override:', error);
      toast.error('Failed to remove price override');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate costs
  const mealNetCost = meal ? calcMealNet(meal, meal.ingredients) : 0;
  const totalIngredientCost = meal ? meal.ingredients.reduce((total, ing) => 
    total + (ing.price_net * ing.quantity), 0
  ) : 0;

  if (!meal && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Meal Details - {meal?.name || 'Loading...'}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading meal details...</p>
            </div>
          </div>
        ) : meal ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Basic Info</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients & Costs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="flex-1 overflow-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveMeal)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Spaghetti Bolognese" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the meal..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_net_override"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Override (€)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty to calculate from ingredients"
                              {...field}
                              value={field.value || ''}
                            />
                            {meal.price_net_override !== null && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemovePriceOverride}
                                disabled={isSubmitting}
                                className="whitespace-nowrap"
                              >
                                Clear Override
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Cost Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Ingredient Cost:</span>
                          <Badge variant="outline">€{totalIngredientCost.toFixed(2)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Final Meal Cost:</span>
                          <Badge variant="default">€{mealNetCost.toFixed(2)}</Badge>
                        </div>
                        {meal.price_net_override && (
                          <p className="text-xs text-muted-foreground">
                            Using price override instead of calculated cost
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="ingredients" className="flex-1 overflow-auto space-y-4">
              {/* Add Ingredient Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Ingredient
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients
                          .filter(ing => !meal.ingredients.find(mi => mi.id === ing.id))
                          .map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit}) - €{ingredient.price_net.toFixed(2)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={ingredientQuantity}
                      onChange={(e) => setIngredientQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-20"
                    />
                    <Button 
                      onClick={handleAddIngredient}
                      disabled={!selectedIngredientId || ingredientQuantity <= 0}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients List */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Ingredients</CardTitle>
                  <CardDescription>
                    Manage the ingredients in this meal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {meal.ingredients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No ingredients added yet. Add some ingredients to calculate costs.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meal.ingredients.map((ingredient) => (
                          <TableRow key={ingredient.id}>
                            <TableCell className="font-medium">{ingredient.name}</TableCell>
                            <TableCell>{ingredient.unit}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={ingredient.quantity}
                                onChange={(e) => 
                                  handleUpdateIngredientQuantity(ingredient.id, Number(e.target.value))
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              €{ingredient.price_net.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{(ingredient.price_net * ingredient.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSaveMeal)}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 