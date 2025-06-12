'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
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
  Package,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { PacketFormValues, packetSchema } from '@/app/lib/validation-schemas';
import { Packet, Meal, IngredientWithQuantity } from '@/app/lib/pricing';
import { calcMealNet, calcPacketNet } from '@/app/lib/pricing';
import { 
  getPacketWithMeals, 
  updatePacket, 
  addPacketMeal, 
  updatePacketMeal, 
  removePacketMeal
} from '@/app/actions/packets';
import { getMeals } from '@/app/actions/meals';
import { toast } from 'sonner';

interface PacketDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packetId: string | null;
  onPacketUpdated?: (packet: Packet) => void;
  onPacketDeleted?: (packet: Packet) => void;
}

interface MealWithIngredients extends Meal {
  ingredients: IngredientWithQuantity[];
}

interface PacketWithMeals extends Packet {
  meals: Array<MealWithIngredients & { quantity: number }>;
}

export function PacketDetailsDialog({
  open,
  onOpenChange,
  packetId,
  onPacketUpdated,
  onPacketDeleted
}: PacketDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packet, setPacket] = useState<PacketWithMeals | null>(null);
  const [availableMeals, setAvailableMeals] = useState<MealWithIngredients[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Enhanced search state
  const [mealSearchQuery, setMealSearchQuery] = useState<string>('');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [mealQuantity, setMealQuantity] = useState<number>(1);
  const [showMealSearch, setShowMealSearch] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PacketFormValues>({
    resolver: zodResolver(packetSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      price_net_override: null,
    },
  });

  // Load packet data when dialog opens
  useEffect(() => {
    if (open && packetId) {
      loadPacketData();
      loadAvailableMeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, packetId]);

  // Update form when packet data changes
  useEffect(() => {
    if (packet) {
      form.reset({
        id: packet.id,
        name: packet.name,
        description: packet.description,
        price_net_override: packet.price_net_override,
      });
    }
  }, [packet, form]);

  // Enhanced search functionality with memoization
  const filteredMeals = useMemo(() => {
    if (!mealSearchQuery.trim() || !availableMeals.length) return [];
    
    const query = mealSearchQuery.toLowerCase();
    const usedMealIds = new Set(packet?.meals.map(meal => meal.id) || []);
    
    return availableMeals
      .filter(meal => 
        !usedMealIds.has(meal.id) && (
          meal.name.toLowerCase().includes(query) ||
          (meal.description && meal.description.toLowerCase().includes(query))
        )
      )
      .slice(0, 8); // Limit results for performance
  }, [mealSearchQuery, availableMeals, packet?.meals]);

  // Keyboard navigation for search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMealSearch || filteredMeals.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev < filteredMeals.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : filteredMeals.length - 1
        );
      } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
        e.preventDefault();
        const selectedMeal = filteredMeals[selectedSearchIndex];
        handleSelectMeal(selectedMeal);
      } else if (e.key === 'Escape') {
        setShowMealSearch(false);
        setSelectedSearchIndex(-1);
      }
    };

    if (showMealSearch) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showMealSearch, filteredMeals, selectedSearchIndex]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-search-container]')) {
        setShowMealSearch(false);
        setSelectedSearchIndex(-1);
      }
    };

    if (showMealSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMealSearch]);

  const loadPacketData = async () => {
    if (!packetId) return;
    
    setIsLoading(true);
    try {
      const packetData = await getPacketWithMeals(packetId);
      setPacket(packetData as PacketWithMeals);
    } catch (error) {
      console.error('Failed to load packet:', error);
      toast.error('Failed to load packet details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableMeals = async () => {
    try {
      const meals = await getMeals();
      // Add empty ingredients array to each meal for compatibility
      const mealsWithIngredients = meals.map(meal => ({
        ...meal,
        ingredients: [] as IngredientWithQuantity[]
      }));
      setAvailableMeals(mealsWithIngredients);
    } catch (error) {
      console.error('Failed to load meals:', error);
      toast.error('Failed to load meals');
    }
  };

  const handleSavePacket = async (data: PacketFormValues) => {
    if (!packet) return;
    
    setIsSubmitting(true);
    try {
      data.id = packet.id;
      await updatePacket(data);
      
      // Update local state
      const updatedPacket = { ...packet, ...data };
      setPacket(updatedPacket);
      
      if (onPacketUpdated) {
        onPacketUpdated(updatedPacket);
      }
      
      toast.success('Packet updated successfully');
    } catch (error) {
      console.error('Failed to update packet:', error);
      toast.error('Failed to update packet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMeal = (meal: MealWithIngredients) => {
    setSelectedMealId(meal.id);
    setMealSearchQuery(meal.name);
    setShowMealSearch(false);
    setSelectedSearchIndex(-1);
    
    // Focus quantity input after selection
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 100);
  };

  const handleAddMeal = async () => {
    if (!selectedMealId || mealQuantity <= 0 || !packet) return;

    setIsAddingMeal(true);
    try {
      await addPacketMeal(packet.id, selectedMealId, mealQuantity);
      
      // Refresh packet data to get updated meals
      await loadPacketData();
      
      // Reset form
      setMealSearchQuery('');
      setSelectedMealId('');
      setMealQuantity(1);
      
      toast.success('Meal added successfully');
      
      // Focus back to search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to add meal:', error);
      toast.error('Failed to add meal');
    } finally {
      setIsAddingMeal(false);
    }
  };

  // Debounced quantity update for better UX
  const debouncedUpdateQuantity = useCallback(
    debounce(async (mealId: string, newQuantity: number) => {
      if (!packet) return;
      
      try {
        await updatePacketMeal(packet.id, mealId, newQuantity);
        await loadPacketData();
        toast.success('Quantity updated');
      } catch (error) {
        console.error('Failed to update quantity:', error);
        toast.error('Failed to update quantity');
      }
    }, 500),
    [packet]
  );

  const handleUpdateMealQuantity = (mealId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    debouncedUpdateQuantity(mealId, newQuantity);
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!packet) return;
    
    try {
      await removePacketMeal(packet.id, mealId);
      await loadPacketData();
      toast.success('Meal removed');
    } catch (error) {
      console.error('Failed to remove meal:', error);
      toast.error('Failed to remove meal');
    }
  };

  const handleDeletePacket = () => {
    setShowDeleteConfirm(false);
    if (packet && onPacketDeleted) {
      onPacketDeleted(packet);
      // Close the dialog after successful deletion with a small delay
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    }
  };

  // Calculate costs with proper null handling and form reactivity
  const formValues = form.watch();
  const currentPriceOverride = formValues.price_net_override;
  
  const packetNetCost = (() => {
    // If there's a valid override price (not null/undefined/NaN), use it
    if (currentPriceOverride !== null && currentPriceOverride !== undefined && !isNaN(currentPriceOverride)) {
      return currentPriceOverride;
    }
    // Otherwise calculate from meals
    return packet ? calcPacketNet(packet, packet.meals) : 0;
  })();

  const totalMealsCost = packet ? packet.meals.reduce((total, meal) => 
    total + ((meal.price_net_override || calcMealNet(meal, meal.ingredients)) * meal.quantity), 0
  ) : 0;

  if (!packet && !isLoading) {
    return null;
  }

  // Show delete confirmation dialog
  if (showDeleteConfirm && packet && onPacketDeleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Packet
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to delete the packet &quot;{packet.name}&quot;? 
              <br />
              <strong className="text-destructive">This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 my-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>This will remove the packet and its meal configuration.</span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeletePacket}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {packet?.name || 'Loading...'} 
            {packet && (
              <Badge variant="outline" className="ml-2">
                {packet.meals.length} meal{packet.meals.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading packet details...</p>
            </div>
          </div>
        ) : packet ? (
          <div className="flex-1 overflow-auto space-y-6">
            {/* Enhanced Basic Info Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSavePacket)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Packet Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Family Dinner Package" 
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
                            {packet.price_net_override !== null && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const updatedPacket = { ...packet, price_net_override: null };
                                    setPacket(updatedPacket);
                                    form.setValue('price_net_override', null);
                                    if (onPacketUpdated) {
                                      onPacketUpdated(updatedPacket);
                                    }
                                    toast.success('Price override removed');
                                  } catch (error) {
                                    toast.error('Failed to remove price override');
                                  }
                                }}
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

            {/* Enhanced Add Meal Section */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  Add Meal
                </CardTitle>
                <CardDescription>
                  Search and add meals to create your packet bundle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2" data-search-container>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search meals... (try typing 'pasta' or 'chicken')"
                        value={mealSearchQuery}
                        onChange={(e) => {
                          setMealSearchQuery(e.target.value);
                          setShowMealSearch(e.target.value.length > 0);
                          setSelectedSearchIndex(-1);
                        }}
                        onFocus={() => setShowMealSearch(mealSearchQuery.length > 0)}
                        className="pl-10 transition-all duration-200 focus:ring-2"
                        disabled={isAddingMeal}
                      />
                      {showMealSearch && filteredMeals.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 duration-200">
                          {filteredMeals.map((meal, index) => (
                            <div
                              key={meal.id}
                              className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors duration-150 ${
                                index === selectedSearchIndex
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handleSelectMeal(meal)}
                            >
                              <div className="font-medium">{meal.name}</div>
                              <div className={`text-sm ${
                                index === selectedSearchIndex ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {meal.price_net_override 
                                  ? `€${meal.price_net_override.toFixed(2)} (custom price)`
                                  : 'Auto-calculated from ingredients'
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showMealSearch && mealSearchQuery.length > 0 && filteredMeals.length === 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg p-3 text-center text-muted-foreground">
                          No meals found matching &quot;{mealSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                    <Input
                      ref={quantityInputRef}
                      type="number"
                      min="1"
                      step="1"
                      value={mealQuantity}
                      onChange={(e) => setMealQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                      disabled={isAddingMeal}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedMealId && mealQuantity > 0) {
                          handleAddMeal();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddMeal}
                      disabled={!selectedMealId || mealQuantity <= 0 || isAddingMeal}
                      className="whitespace-nowrap transition-all duration-200"
                    >
                      {isAddingMeal ? (
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
                  {filteredMeals.length === 0 && mealSearchQuery.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Use keyboard arrows to navigate results and Enter to select
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Meals List */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>Current Meals</CardTitle>
                <CardDescription>
                  Manage quantities and remove meals • Click in quantity field to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packet.meals.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No meals added yet</p>
                    <p className="text-sm text-muted-foreground">Add meals above to create your packet bundle</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Meal</TableHead>
                          <TableHead className="w-[120px]">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packet.meals.map((meal) => (
                          <TableRow key={meal.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{meal.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={meal.quantity}
                                onBlur={(e) => {
                                  const newQuantity = Number(e.target.value);
                                  if (newQuantity !== meal.quantity && newQuantity > 0) {
                                    handleUpdateMealQuantity(meal.id, newQuantity);
                                  }
                                }}
                                className="w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              €{(meal.price_net_override || calcMealNet(meal, meal.ingredients)).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{((meal.price_net_override || calcMealNet(meal, meal.ingredients)) * meal.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMeal(meal.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Remove meal"
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
                      <span className="text-sm">Total Meals Base Cost:</span>
                      <Badge variant="outline" className="text-base font-mono">
                        €{totalMealsCost.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Final Packet Cost:</span>
                      <Badge variant="default" className="text-base font-mono">
                        €{(typeof packetNetCost === 'number' && !isNaN(packetNetCost) ? packetNetCost : 0).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {packet.price_net_override !== null ? (
                      <p className="text-orange-600">🔒 Using custom price override</p>
                    ) : (
                      <p className="text-green-600">🧮 Auto-calculated from meals</p>
                    )}
                    {packet.meals.length > 0 && (
                      <p>Average cost per meal: €{(totalMealsCost / packet.meals.length).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        
        <DialogFooter className="flex justify-between">
          {/* Show delete button only when onPacketDeleted is provided */}
          {onPacketDeleted ? (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Packet
            </Button>
          ) : (
            <div /> // Spacer for layout
          )}
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSavePacket)}
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
          </div>
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