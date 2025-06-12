'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useCart } from '@/app/providers/cart-provider';
import { searchItems } from '@/app/actions/cart';
import LogoutButton from '@/app/components/LogoutButton';
import CartSidebar, { CartSummaryFixed } from '@/app/components/cart-sidebar';
import { AddToCartDialog } from '@/app/components/add-to-cart-dialog';
import { IngredientEditDialog } from '@/app/dashboard/ingredients/components/ingredient-edit-dialog';
import { IngredientFormDialog } from '@/app/dashboard/ingredients/components/ingredient-form-dialog';
import { MealFormDialog } from '@/app/dashboard/meals/components/meal-form-dialog';
import { MealDetailsDialog } from '@/app/dashboard/meals/components/meal-details-dialog';
import { PacketFormDialog } from '@/app/dashboard/packets/components/packet-form-dialog';
import { PacketDetailsDialog } from '@/app/dashboard/packets/components/packet-details-dialog';
import { createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { createMeal, deleteMeal, updateMeal, getMealWithIngredients } from '@/app/actions/meals';
import { createPacket, deletePacket, updatePacket, getPacketWithMeals } from '@/app/actions/packets';
import { IngredientFormValues, MealFormValues, PacketFormValues } from '@/app/lib/validation-schemas';
import { 
  Package, 
  ShoppingCart, 
  Utensils, 
  Wheat,
  TrendingUp,
  Search,
  Plus,
  User,
  Star,
  Clock,
  DollarSign,
  Eye,
  Settings,
  Filter,
  MoreHorizontal,
  Edit
} from 'lucide-react';
import { getMealPriceDisplay, getPacketPriceDisplay } from '@/app/lib/price-utils';
import { IngredientWithQuantity } from '@/app/lib/pricing';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  price_net: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  category?: string;
}

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price_net_override: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

interface Packet {
  id: string;
  name: string;
  description: string | null;
  price_net_override: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

interface MealWithIngredients extends Meal {
  ingredients: IngredientWithQuantity[];
}

interface PacketWithMeals extends Packet {
  meals: Array<MealWithIngredients & { quantity: number }>;
}

interface NewDashboardProps {
  userEmail: string;
  ingredients: Ingredient[];
  meals: MealWithIngredients[];
  packets: PacketWithMeals[];
}

export default function NewDashboard({ userEmail, ingredients, meals, packets }: NewDashboardProps) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { cart, cartItems, addItem } = useCart();
  
  // Ingredient management state
  const [localIngredients, setLocalIngredients] = useState<Ingredient[]>(ingredients || []);
  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] = useState(false);
  const [isEditIngredientDialogOpen, setIsEditIngredientDialogOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);
  const [isIngredientSubmitting, setIsIngredientSubmitting] = useState(false);

  // Meal management state
  const [localMeals, setLocalMeals] = useState<MealWithIngredients[]>(meals || []);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [isEditMealDialogOpen, setIsEditMealDialogOpen] = useState(false);
  const [isMealDetailsDialogOpen, setIsMealDetailsDialogOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<MealWithIngredients | null>(null);
  const [currentMealId, setCurrentMealId] = useState<string | null>(null);
  const [isMealSubmitting, setIsMealSubmitting] = useState(false);

  // Packet management state
  const [localPackets, setLocalPackets] = useState<PacketWithMeals[]>(packets || []);
  const [isAddPacketDialogOpen, setIsAddPacketDialogOpen] = useState(false);
  const [isEditPacketDialogOpen, setIsEditPacketDialogOpen] = useState(false);
  const [isPacketDetailsDialogOpen, setIsPacketDetailsDialogOpen] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<PacketWithMeals | null>(null);
  const [currentPacketId, setCurrentPacketId] = useState<string | null>(null);
  const [isPacketSubmitting, setIsPacketSubmitting] = useState(false);

  // Add to cart state
  const [isAddToCartDialogOpen, setIsAddToCartDialogOpen] = useState(false);
  const [cartItemToAdd, setCartItemToAdd] = useState<{ item: MealWithIngredients | PacketWithMeals; type: 'meal' | 'packet' } | null>(null);

  // Safety check to prevent undefined errors
  const safeCartItems = cartItems || [];
  const safeIngredients = localIngredients || [];
  const safeMeals = localMeals || [];
  const safePackets = localPackets || [];

  const filteredIngredients = safeIngredients.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMeals = safeMeals.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPackets = safePackets.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    totalItems: safeIngredients.length + safeMeals.length + safePackets.length,
    ingredients: safeIngredients.length,
    meals: safeMeals.length,
    packets: safePackets.length,
    cartItems: safeCartItems.reduce((sum, item) => sum + item.quantity, 0)
  };

  const handleAddToCart = (item: MealWithIngredients | PacketWithMeals, type: 'meal' | 'packet') => {
    setCartItemToAdd({ item, type });
    setIsAddToCartDialogOpen(true);
  };

  const handleAddToCartConfirm = async (itemId: string, itemType: 'meal' | 'packet', quantity: number, markupPct: number) => {
    try {
      await addItem(itemType, itemId, quantity, markupPct);
      setIsAddToCartDialogOpen(false);
      setCartItemToAdd(null);
      // Toast success will be handled by the AddToCartDialog component
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Toast error will be handled by the AddToCartDialog component
      throw error; // Re-throw to let the dialog handle it
    }
  };

  // Ingredient management handlers
  const handleAddIngredient = () => {
    setIsAddIngredientDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setIsEditIngredientDialogOpen(true);
  };

  const handleCreateIngredient = async (data: IngredientFormValues) => {
    setIsIngredientSubmitting(true);
    try {
      const result = await createIngredient(data);
      if (result.success && result.data) {
        setLocalIngredients([...localIngredients, result.data as Ingredient]);
        setIsAddIngredientDialogOpen(false);
        toast.success('Ingredient created successfully', {
          description: `${data.name} has been added to your inventory`
        });
      }
    } catch (error) {
      console.error('Failed to create ingredient:', error);
      toast.error('Failed to create ingredient', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsIngredientSubmitting(false);
    }
  };

  const handleUpdateIngredient = async (data: IngredientFormValues) => {
    setIsIngredientSubmitting(true);
    try {
      const result = await updateIngredient(data);
      if (result.success && result.data) {
        setLocalIngredients(
          localIngredients.map((item) => 
            item.id === data.id ? result.data as Ingredient : item
          )
        );
        setIsEditIngredientDialogOpen(false);
        setCurrentIngredient(null);
        toast.success('Ingredient updated successfully', {
          description: 'Your ingredient has been updated'
        });
        
        // Trigger cascading updates for meals and packets using this ingredient
        if (data.id) {
          debouncedRefreshMealsUsingIngredient(data.id);
        }
      }
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      toast.error('Failed to update ingredient', {
        description: 'Please try again'
      });
    } finally {
      setIsIngredientSubmitting(false);
    }
  };

  const handleDeleteIngredient = async () => {
    if (!currentIngredient) return;
    
    setIsIngredientSubmitting(true);
    try {
      const result = await deleteIngredient(currentIngredient.id);
      if (result.success) {
        const deletedIngredientId = currentIngredient.id;
        
        setLocalIngredients(
          localIngredients.filter((item) => item.id !== currentIngredient.id)
        );
        setIsEditIngredientDialogOpen(false);
        setCurrentIngredient(null);
        toast.success('Ingredient deleted successfully', {
          description: `${currentIngredient.name} has been removed from your inventory`
        });
        
        // Trigger cascading updates for meals and packets using this ingredient
        debouncedRefreshMealsUsingIngredient(deletedIngredientId);
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      toast.error('Failed to delete ingredient', {
        description: 'Please try again'
      });
    } finally {
      setIsIngredientSubmitting(false);
    }
  };

  // Meal management handlers
  const handleAddMeal = () => {
    setIsAddMealDialogOpen(true);
  };

  const handleEditMeal = (meal: MealWithIngredients) => {
    setCurrentMeal(meal);
    setIsEditMealDialogOpen(true);
  };

  const handleViewMealDetails = (meal: MealWithIngredients) => {
    setCurrentMealId(meal.id);
    setIsMealDetailsDialogOpen(true);
  };

  const handleCreateMeal = async (data: MealFormValues) => {
    setIsMealSubmitting(true);
    try {
      const result = await createMeal(data);
      if (result.success && result.data) {
        setLocalMeals([...localMeals, result.data as MealWithIngredients]);
        setIsAddMealDialogOpen(false);
        toast.success('Meal created successfully', {
          description: `${data.name} has been added to your menu`
        });
      }
    } catch (error) {
      console.error('Failed to create meal:', error);
      toast.error('Failed to create meal', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsMealSubmitting(false);
    }
  };

  const handleUpdateMeal = async (data: MealFormValues) => {
    if (!data.id) return;
    
    setIsMealSubmitting(true);
    try {
      const result = await updateMeal(data);
      if (result.success && result.data) {
        setLocalMeals(
          localMeals.map((item) => 
            item.id === data.id ? result.data as MealWithIngredients : item
          )
        );
        setIsEditMealDialogOpen(false);
        toast.success('Meal updated successfully', {
          description: `${data.name} has been updated`
        });
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error('Failed to update meal', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsMealSubmitting(false);
    }
  };

  const handleDeleteMeal = async (meal: MealWithIngredients) => {
    setIsMealSubmitting(true);
    try {
      const result = await deleteMeal(meal.id);
      if (result.success) {
        const deletedMealId = meal.id;
        
        setLocalMeals(
          localMeals.filter((item) => item.id !== meal.id)
        );
        setIsEditMealDialogOpen(false);
        setCurrentMeal(null);
        toast.success('Meal deleted successfully', {
          description: `${meal.name} has been removed from your menu`
        });
        
        // Trigger cascading updates for packets containing this meal
        debouncedRefreshPacketsContainingMeal(deletedMealId);
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast.error('Failed to delete meal', {
        description: 'Please try again'
      });
    } finally {
      setIsMealSubmitting(false);
    }
  };

  // Packet management handlers
  const handleAddPacket = () => {
    setIsAddPacketDialogOpen(true);
  };

  const handleEditPacket = (packet: PacketWithMeals) => {
    setCurrentPacket(packet);
    setIsEditPacketDialogOpen(true);
  };

  const handleViewPacketDetails = (packet: PacketWithMeals) => {
    setCurrentPacketId(packet.id);
    setIsPacketDetailsDialogOpen(true);
  };

  const handleCreatePacket = async (data: PacketFormValues) => {
    setIsPacketSubmitting(true);
    try {
      const result = await createPacket(data);
      if (result.success && result.data) {
        setLocalPackets([...localPackets, result.data as PacketWithMeals]);
        setIsAddPacketDialogOpen(false);
        toast.success('Packet created successfully', {
          description: `${data.name} has been added to your inventory`
        });
      }
    } catch (error) {
      console.error('Failed to create packet:', error);
      toast.error('Failed to create packet', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsPacketSubmitting(false);
    }
  };

  const handleUpdatePacket = async (data: PacketFormValues) => {
    if (!data.id) return;
    
    setIsPacketSubmitting(true);
    try {
      const result = await updatePacket(data);
      if (result.success && result.data) {
        setLocalPackets(
          localPackets.map((item) => 
            item.id === data.id ? result.data as PacketWithMeals : item
          )
        );
        setIsEditPacketDialogOpen(false);
        toast.success('Packet updated successfully', {
          description: `${data.name} has been updated`
        });
      }
    } catch (error) {
      console.error('Failed to update packet:', error);
      toast.error('Failed to update packet', {
        description: 'Please try again or check your input'
      });
    } finally {
      setIsPacketSubmitting(false);
    }
  };

  const handleDeletePacket = async (packet: PacketWithMeals) => {
    setIsPacketSubmitting(true);
    try {
      const result = await deletePacket(packet.id);
      if (result.success) {
        setLocalPackets(
          localPackets.filter((item) => item.id !== packet.id)
        );
        setIsEditPacketDialogOpen(false);
        toast.success('Packet deleted successfully', {
          description: `${packet.name} has been removed from your inventory`
        });
      }
    } catch (error) {
      console.error('Failed to delete packet:', error);
      toast.error('Failed to delete packet', {
        description: 'Please try again'
      });
    } finally {
      setIsPacketSubmitting(false);
    }
  };

  // Add refresh tracking to prevent duplicate updates
  const refreshTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounced cascading update functions to prevent excessive API calls
  const debouncedRefreshPacketsContainingMeal = useCallback((mealId: string, delay: number = 300) => {
    const existing = refreshTimeouts.current.get(`packet-${mealId}`);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      refreshPacketsContainingMeal(mealId);
      refreshTimeouts.current.delete(`packet-${mealId}`);
    }, delay);
    
    refreshTimeouts.current.set(`packet-${mealId}`, timeout);
  }, [localPackets]);

  const debouncedRefreshMealsUsingIngredient = useCallback((ingredientId: string, delay: number = 300) => {
    const existing = refreshTimeouts.current.get(`meal-${ingredientId}`);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      refreshMealsUsingIngredient(ingredientId);
      refreshTimeouts.current.delete(`meal-${ingredientId}`);
    }, delay);
    
    refreshTimeouts.current.set(`meal-${ingredientId}`, timeout);
  }, [localMeals]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      refreshTimeouts.current.forEach(timeout => clearTimeout(timeout));
      refreshTimeouts.current.clear();
    };
  }, []);

  // Helper function to refresh packets that contain a specific meal
  const refreshPacketsContainingMeal = async (mealId: string) => {
    try {
      // Find packets that contain this meal
      const packetsToRefresh = localPackets.filter(packet => 
        packet.meals?.some(meal => meal.id === mealId)
      );
      
      if (packetsToRefresh.length === 0) {
        return; // No packets to refresh
      }
      
      // Refetch each packet's data with error handling for deleted items
      const refreshPromises = packetsToRefresh.map(async (packet) => {
        try {
          return await getPacketWithMeals(packet.id);
        } catch (error) {
          console.warn(`Failed to refresh packet ${packet.id}, it may have been deleted:`, error);
          return null; // Mark for removal
        }
      });
      
      const refreshedPackets = await Promise.all(refreshPromises);
      
      // Update local state, filtering out deleted packets
      setLocalPackets(prevPackets => 
        prevPackets.map(packet => {
          const refreshedPacket = refreshedPackets.find(rp => rp?.id === packet.id);
          return refreshedPacket ? refreshedPacket as PacketWithMeals : packet;
        }).filter(packet => {
          // Remove packets that failed to load (might be deleted)
          const stillExists = refreshedPackets.some(rp => rp?.id === packet.id);
          return stillExists || !packetsToRefresh.some(ptr => ptr.id === packet.id);
        })
      );
    } catch (error) {
      console.error('Failed to refresh packets containing meal:', error);
    }
  };

  // Helper function to refresh meals that use a specific ingredient
  const refreshMealsUsingIngredient = async (ingredientId: string) => {
    try {
      // Find meals that use this ingredient
      const mealsToRefresh = localMeals.filter(meal =>
        meal.ingredients?.some(ing => ing.id === ingredientId)
      );
      
      if (mealsToRefresh.length === 0) {
        return; // No meals to refresh
      }
      
      // Refetch each meal's data with error handling for deleted items
      const refreshPromises = mealsToRefresh.map(async (meal) => {
        try {
          return await getMealWithIngredients(meal.id);
        } catch (error) {
          console.warn(`Failed to refresh meal ${meal.id}, it may have been deleted:`, error);
          return null; // Mark for removal
        }
      });
      
      const refreshedMeals = await Promise.all(refreshPromises);
      
      // Update local state, filtering out deleted meals
      setLocalMeals(prevMeals =>
        prevMeals.map(meal => {
          const refreshedMeal = refreshedMeals.find(rm => rm?.id === meal.id);
          return refreshedMeal ? refreshedMeal as MealWithIngredients : meal;
        }).filter(meal => {
          // Remove meals that failed to load (might be deleted)
          const stillExists = refreshedMeals.some(rm => rm?.id === meal.id);
          return stillExists || !mealsToRefresh.some(mtr => mtr.id === meal.id);
        })
      );

      // Also refresh packets that contain these meals (only for successfully refreshed meals)
      const successfulMealIds = refreshedMeals
        .filter(rm => rm !== null)
        .map(rm => rm!.id);
      
      // Use direct function call here to avoid infinite loops
      await Promise.all(successfulMealIds.map(mealId => refreshPacketsContainingMeal(mealId)));
    } catch (error) {
      console.error('Failed to refresh meals using ingredient:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TooltipProvider>
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg"
        >
          <div className="container mx-auto px-6 py-2">
            <div className="flex items-center justify-between w-full">
              {/* Left edge - App name and logo */}
              <div className="flex items-center space-x-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
                >
                  <Utensils className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Costify Pro
                  </h1>
                  <p className="text-xs text-muted-foreground">Professional Food Costing</p>
                </div>
              </div>
              
              {/* Right edge - User email and logout button */}
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{userEmail}</span>
                </div>
                
                <LogoutButton />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Layout */}
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Tabs - Updated with 3D effects */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 gap-3 bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="ingredients" 
                    className="flex items-center justify-center space-x-3 h-16 w-full max-w-xs mx-auto rounded-lg border border-muted/50 bg-card hover:border-green-500 hover:shadow-lg hover:shadow-green-400/30 hover:scale-105 hover:-translate-y-1 data-[state=active]:bg-green-200/90 data-[state=active]:border-green-600 data-[state=active]:shadow-xl data-[state=active]:shadow-green-500/40 data-[state=active]:scale-105 data-[state=active]:-translate-y-2 transition-all duration-300"
                  >
                    <Wheat className="h-10 w-10 text-green-600" />
                    <span className="text-lg font-medium tab-button-text">Ingredients</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="meals" 
                    className="flex items-center justify-center space-x-3 h-16 w-full max-w-xs mx-auto rounded-lg border border-muted/50 bg-card hover:border-blue-500 hover:shadow-lg hover:shadow-blue-400/30 hover:scale-105 hover:-translate-y-1 data-[state=active]:bg-blue-200/90 data-[state=active]:border-blue-600 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/40 data-[state=active]:scale-105 data-[state=active]:-translate-y-2 transition-all duration-300"
                  >
                    <Utensils className="h-10 w-10 text-blue-600" />
                    <span className="text-lg font-medium tab-button-text">Meals</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="packets" 
                    className="flex items-center justify-center space-x-3 h-16 w-full max-w-xs mx-auto rounded-lg border border-muted/50 bg-card hover:border-purple-500 hover:shadow-lg hover:shadow-purple-400/30 hover:scale-105 hover:-translate-y-1 data-[state=active]:bg-purple-200/90 data-[state=active]:border-purple-600 data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/40 data-[state=active]:scale-105 data-[state=active]:-translate-y-2 transition-all duration-300"
                  >
                    <Package className="h-10 w-10 text-purple-600" />
                    <span className="text-lg font-medium tab-button-text">Packets</span>
                  </TabsTrigger>
                </TabsList>

                {/* Search Bar - Moved between tabs and content */}
                <div className="mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search ingredients, meals, and packets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 text-base bg-background border-2 border-muted rounded-xl shadow-sm hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Ingredients Tab */}
                <TabsContent value="ingredients" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Ingredients</h2>
                    <Button 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={handleAddIngredient}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Ingredient</span>
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    <motion.div 
                      className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {filteredIngredients.map((ingredient, index) => (
                        <motion.div
                          key={ingredient.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ 
                            y: -6, 
                            scale: 1.03,
                            transition: { duration: 0.15, ease: "easeOut" }
                          }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 border-green-300/80 bg-card/50 backdrop-blur-sm hover:border-green-600 hover:shadow-lg hover:shadow-green-500/30 hover:bg-card/80">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{ingredient.name}</CardTitle>
                                <div className="flex space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-700"
                                        onClick={() => handleEditIngredient(ingredient)}
                                      >
                                        <Edit className="h-5 w-5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit ingredient</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-semibold text-green-600">
                                  €{ingredient.price_net.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  per {ingredient.unit}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* Meals Tab - Changed to 4-column grid */}
                <TabsContent value="meals" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Meals</h2>
                    <Button 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={handleAddMeal}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Meal</span>
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    <motion.div 
                      className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {filteredMeals.map((meal, index) => (
                        <motion.div
                          key={meal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ 
                            y: -6, 
                            scale: 1.03,
                            transition: { duration: 0.15, ease: "easeOut" }
                          }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 border-blue-300/80 bg-card/50 backdrop-blur-sm hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/30 hover:bg-card/80">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{meal.name}</CardTitle>
                                <div className="flex space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700"
                                        onClick={() => handleAddToCart(meal, 'meal')}
                                      >
                                        <ShoppingCart className="h-5 w-5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add to cart</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700"
                                        onClick={() => {
                                          setCurrentMealId(meal.id);
                                          setIsMealDetailsDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-5 w-5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit meal</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-semibold text-blue-600">
                                  {getMealPriceDisplay(meal, meal.ingredients)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  per meal
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* Packets Tab - Changed to 4-column grid */}
                <TabsContent value="packets" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Packets</h2>
                    <Button 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={handleAddPacket}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Packet</span>
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    <motion.div 
                      className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {filteredPackets.map((packet, index) => (
                        <motion.div
                          key={packet.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ 
                            y: -6, 
                            scale: 1.03,
                            transition: { duration: 0.15, ease: "easeOut" }
                          }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 border-purple-300/80 bg-card/50 backdrop-blur-sm hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/30 hover:bg-card/80">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{packet.name}</CardTitle>
                                <div className="flex space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 hover:bg-purple-100 hover:text-purple-700"
                                        onClick={() => handleAddToCart(packet, 'packet')}
                                      >
                                        <ShoppingCart className="h-5 w-5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add to cart</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 hover:bg-purple-100 hover:text-purple-700"
                                        onClick={() => {
                                          setCurrentPacketId(packet.id);
                                          setIsPacketDetailsDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-5 w-5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit packet</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-semibold text-purple-600">
                                  {getPacketPriceDisplay(packet, packet.meals)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  per packet
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            </motion.div>
          </main>

          {/* Cart Sidebar */}
          <CartSidebar />
        </div>
        
        {/* Add to Cart Dialog */}
        <AddToCartDialog
          open={isAddToCartDialogOpen}
          onOpenChange={setIsAddToCartDialogOpen}
          item={cartItemToAdd?.item || null}
          itemType={cartItemToAdd?.type || null}
          onAddToCart={handleAddToCartConfirm}
        />
        
        {/* Ingredient Management Dialogs */}
        <IngredientFormDialog
          open={isAddIngredientDialogOpen}
          onOpenChange={setIsAddIngredientDialogOpen}
          onSubmit={handleCreateIngredient}
          isSubmitting={isIngredientSubmitting}
          title="Add New Ingredient"
        />

        {currentIngredient && (
          <IngredientEditDialog
            open={isEditIngredientDialogOpen}
            onOpenChange={setIsEditIngredientDialogOpen}
            ingredient={currentIngredient}
            onSave={handleUpdateIngredient}
            onDelete={handleDeleteIngredient}
            isSubmitting={isIngredientSubmitting}
          />
        )}

        {/* Meal Management Dialogs */}
        <MealFormDialog
          open={isAddMealDialogOpen}
          onOpenChange={setIsAddMealDialogOpen}
          onSubmit={handleCreateMeal}
          isSubmitting={isMealSubmitting}
          title="Create New Meal"
        />

        {currentMeal && (
          <MealFormDialog
            open={isEditMealDialogOpen}
            onOpenChange={setIsEditMealDialogOpen}
            onSubmit={handleUpdateMeal}
            defaultValues={currentMeal}
            isSubmitting={isMealSubmitting}
            title="Edit Meal"
          />
        )}

        <MealDetailsDialog
          open={isMealDetailsDialogOpen}
          onOpenChange={setIsMealDetailsDialogOpen}
          mealId={currentMealId}
          onMealUpdated={async (updatedMeal) => {
            try {
              const fullMealData = await getMealWithIngredients(updatedMeal.id);
            setLocalMeals(
              localMeals.map((meal) => 
                  meal.id === updatedMeal.id ? fullMealData as MealWithIngredients : meal
                )
              );
              
              // Also refresh packets that contain this meal
              debouncedRefreshPacketsContainingMeal(updatedMeal.id);
            } catch (error) {
              console.error('Failed to refetch meal data:', error);
              setLocalMeals(
                localMeals.map((meal) => 
                  meal.id === updatedMeal.id ? { ...meal, ...updatedMeal } : meal
              )
            );
            }
          }}
        />

        {/* Packet Management Dialogs */}
        <PacketFormDialog
          open={isAddPacketDialogOpen}
          onOpenChange={setIsAddPacketDialogOpen}
          onSubmit={handleCreatePacket}
          isSubmitting={isPacketSubmitting}
          title="Create New Packet"
        />

        {currentPacket && (
          <PacketFormDialog
            open={isEditPacketDialogOpen}
            onOpenChange={setIsEditPacketDialogOpen}
            onSubmit={handleUpdatePacket}
            defaultValues={currentPacket}
            isSubmitting={isPacketSubmitting}
            title="Edit Packet"
          />
        )}

        <PacketDetailsDialog
          open={isPacketDetailsDialogOpen}
          onOpenChange={setIsPacketDetailsDialogOpen}
          packetId={currentPacketId}
          onPacketUpdated={async (updatedPacket) => {
            try {
              const fullPacketData = await getPacketWithMeals(updatedPacket.id);
            setLocalPackets(
              localPackets.map((packet) => 
                  packet.id === updatedPacket.id ? fullPacketData as PacketWithMeals : packet
                )
              );
            } catch (error) {
              console.error('Failed to refetch packet data:', error);
              setLocalPackets(
                localPackets.map((packet) => 
                  packet.id === updatedPacket.id ? { ...packet, ...updatedPacket } : packet
              )
            );
            }
          }}
        />
        
        {/* Fixed Cart Summary at Bottom Right */}
        <CartSummaryFixed />
      </TooltipProvider>
    </div>
  );
} 