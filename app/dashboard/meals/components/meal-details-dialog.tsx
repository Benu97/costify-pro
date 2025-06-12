'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  Search, 
  Loader2, 
  X,
  ChefHat,
  DollarSign
} from 'lucide-react';
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
  
  // Enhanced search state
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState<string>('');
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(1);
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema) as any,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Enhanced search functionality with memoization
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearchQuery.trim() || !availableIngredients.length) return [];
    
    const query = ingredientSearchQuery.toLowerCase();
    const usedIngredientIds = new Set(meal?.ingredients.map(ing => ing.id) || []);
    
    return availableIngredients
      .filter(ingredient => 
        !usedIngredientIds.has(ingredient.id) && (
          ingredient.name.toLowerCase().includes(query) ||
          ingredient.unit.toLowerCase().includes(query)
        )
      )
      .slice(0, 8); // Limit results for performance
  }, [ingredientSearchQuery, availableIngredients, meal?.ingredients]);

  // Keyboard navigation for search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showIngredientSearch || filteredIngredients.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev < filteredIngredients.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : filteredIngredients.length - 1
        );
      } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
        e.preventDefault();
        const selectedIngredient = filteredIngredients[selectedSearchIndex];
        handleSelectIngredient(selectedIngredient);
      } else if (e.key === 'Escape') {
        setShowIngredientSearch(false);
        setSelectedSearchIndex(-1);
      }
    };

    if (showIngredientSearch) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showIngredientSearch, filteredIngredients, selectedSearchIndex]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-search-container]')) {
        setShowIngredientSearch(false);
        setSelectedSearchIndex(-1);
      }
    };

    if (showIngredientSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showIngredientSearch]);

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
      toast.error('Failed to load ingredients');
    }
  };

  const handleSaveMeal = async (data: MealFormValues) => {
    if (!meal) return;
    
    setIsSubmitting(true);
    try {
      data.id = meal.id;
      await updateMeal(data);
      
      // Update local state
      const updatedMeal = { ...meal, ...data };
      setMeal(updatedMeal);
      
      if (onMealUpdated) {
        onMealUpdated(updatedMeal);
      }
      
      toast.success('Meal updated successfully');
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error('Failed to update meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredientId(ingredient.id);
    setIngredientSearchQuery(ingredient.name);
    setShowIngredientSearch(false);
    setSelectedSearchIndex(-1);
    
    // Focus quantity input after selection
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 100);
  };

  const handleAddIngredient = async () => {
    if (!selectedIngredientId || ingredientQuantity <= 0 || !meal) return;

    setIsAddingIngredient(true);
    try {
      await addMealIngredient(meal.id, selectedIngredientId, ingredientQuantity);
      
      // Refresh meal data to get updated ingredients
      await loadMealData();
      
      // Reset form
      setIngredientSearchQuery('');
      setSelectedIngredientId('');
      setIngredientQuantity(1);
      
      toast.success('Ingredient added successfully');
      
      // Focus back to search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      toast.error('Failed to add ingredient');
    } finally {
      setIsAddingIngredient(false);
    }
  };

  // Debounced quantity update for better UX
  const debouncedUpdateQuantity = useCallback(
    debounce(async (ingredientId: string, newQuantity: number) => {
      if (!meal) return;
      
      try {
        await updateMealIngredient(meal.id, ingredientId, newQuantity);
        await loadMealData();
        toast.success('Quantity updated');
      } catch (error) {
        console.error('Failed to update quantity:', error);
        toast.error('Failed to update quantity');
      }
    }, 500),
    [meal]
  );

  const handleUpdateIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    debouncedUpdateQuantity(ingredientId, newQuantity);
  };

  const handleRemoveIngredient = async (ingredientId: string) => {
    if (!meal) return;
    
    try {
      await removeMealIngredient(meal.id, ingredientId);
      await loadMealData();
      toast.success('Ingredient removed');
    } catch (error) {
      console.error('Failed to remove ingredient:', error);
      toast.error('Failed to remove ingredient');
    }
  };

  const handleRemovePriceOverride = async () => {
    if (!meal) return;
    
    try {
      await removeMealPriceOverride(meal.id);
      
      const updatedMeal = { ...meal, price_net_override: null };
      setMeal(updatedMeal);
      form.setValue('price_net_override', null);
      
      if (onMealUpdated) {
        onMealUpdated(updatedMeal);
      }
      
      toast.success('Price override removed');
    } catch (error) {
      console.error('Failed to remove price override:', error);
      toast.error('Failed to remove price override');
    }
  };

  // Calculate costs with proper null handling and form reactivity
  const formValues = form.watch();
  const currentPriceOverride = formValues.price_net_override;
  
  // Add NaN protection to handle edge cases where form validation fails
  const mealNetCost = (() => {
    // If there's a valid override price (not null/undefined/NaN), use it
    if (currentPriceOverride !== null && currentPriceOverride !== undefined && !isNaN(currentPriceOverride)) {
      return currentPriceOverride;
    }
    // Otherwise calculate from ingredients
    return meal ? calcMealNet(meal, meal.ingredients) : 0;
  })();
    
  const totalIngredientCost = meal ? meal.ingredients.reduce((total, ing) => 
    total + (ing.price_net * ing.quantity), 0
  ) : 0;

  if (!meal && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {meal?.name || 'Loading...'} 
            {meal && (
              <Badge variant="outline" className="ml-2">
                {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading meal details...</p>
            </div>
          </div>
        ) : meal ? (
          <div className="flex-1 overflow-auto space-y-6">
            {/* Enhanced Basic Info Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveMeal)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Spaghetti Bolognese" 
                            {...field} 
                            className="transition-all duration-200 focus:ring-2"
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
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Price Override (€)
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty to auto-calculate"
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? null : parseFloat(value));
                              }}
                            />
                            {meal.price_net_override !== null && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemovePriceOverride}
                                disabled={isSubmitting}
                                className="whitespace-nowrap hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                title="Remove price override"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>

            <Separator />

            {/* Enhanced Add Ingredient Section */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  Add Ingredient
                </CardTitle>
                <CardDescription>
                  Search and add ingredients to calculate meal costs automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2" data-search-container>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search ingredients... (try typing 'tom' for tomato)"
                        value={ingredientSearchQuery}
                        onChange={(e) => {
                          setIngredientSearchQuery(e.target.value);
                          setShowIngredientSearch(e.target.value.length > 0);
                          setSelectedSearchIndex(-1);
                        }}
                        onFocus={() => setShowIngredientSearch(ingredientSearchQuery.length > 0)}
                        className="pl-10 transition-all duration-200 focus:ring-2"
                        disabled={isAddingIngredient}
                      />
                      {showIngredientSearch && filteredIngredients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 duration-200">
                          {filteredIngredients.map((ingredient, index) => (
                            <div
                              key={ingredient.id}
                              className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors duration-150 ${
                                index === selectedSearchIndex
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handleSelectIngredient(ingredient)}
                            >
                              <div className="font-medium">{ingredient.name}</div>
                              <div className={`text-sm ${
                                index === selectedSearchIndex ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {ingredient.unit} • €{ingredient.price_net.toFixed(2)} per unit
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showIngredientSearch && ingredientSearchQuery.length > 0 && filteredIngredients.length === 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg p-3 text-center text-muted-foreground">
                          No ingredients found matching &quot;{ingredientSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                    <Input
                      ref={quantityInputRef}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={ingredientQuantity}
                      onChange={(e) => setIngredientQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                      disabled={isAddingIngredient}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedIngredientId && ingredientQuantity > 0) {
                          handleAddIngredient();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddIngredient}
                      disabled={!selectedIngredientId || ingredientQuantity <= 0 || isAddingIngredient}
                      className="whitespace-nowrap transition-all duration-200"
                    >
                      {isAddingIngredient ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                  {filteredIngredients.length === 0 && ingredientSearchQuery.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Use keyboard arrows to navigate results and Enter to select
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Ingredients List */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>Current Ingredients</CardTitle>
                <CardDescription>
                  Manage quantities and remove ingredients • Click in quantity field to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meal.ingredients.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <ChefHat className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No ingredients added yet</p>
                    <p className="text-sm text-muted-foreground">Add ingredients above to calculate meal costs automatically</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="w-[120px]">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meal.ingredients.map((ingredient) => (
                          <TableRow key={ingredient.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{ingredient.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{ingredient.unit}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                defaultValue={ingredient.quantity}
                                onBlur={(e) => {
                                  const newQuantity = Number(e.target.value);
                                  if (newQuantity !== ingredient.quantity && newQuantity > 0) {
                                    handleUpdateIngredientQuantity(ingredient.id, newQuantity);
                                  }
                                }}
                                className="w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              €{ingredient.price_net.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{(ingredient.price_net * ingredient.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Remove ingredient"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Cost Summary */}
            <Card className="border-primary/20 bg-primary/5 transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Ingredient Cost:</span>
                      <Badge variant="outline" className="text-base font-mono">
                        €{totalIngredientCost.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Final Meal Cost:</span>
                      <Badge variant="default" className="text-base font-mono">
                        €{(typeof mealNetCost === 'number' && !isNaN(mealNetCost) ? mealNetCost : 0).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {meal.price_net_override !== null ? (
                      <p className="text-orange-600">🔒 Using custom price override</p>
                    ) : (
                      <p className="text-green-600">🧮 Auto-calculated from ingredients</p>
                    )}
                    {meal.ingredients.length > 0 && (
                      <p>Average cost per ingredient: €{(totalIngredientCost / meal.ingredients.length).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        
        <DialogFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSaveMeal)}
            disabled={isSubmitting || isLoading}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 