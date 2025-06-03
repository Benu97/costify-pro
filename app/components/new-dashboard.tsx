'use client';

import { useState } from 'react';
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
import CartSidebar from '@/app/components/cart-sidebar';
import { AddToCartDialog } from '@/app/components/add-to-cart-dialog';
import { IngredientEditDialog } from '@/app/dashboard/ingredients/components/ingredient-edit-dialog';
import { IngredientFormDialog } from '@/app/dashboard/ingredients/components/ingredient-form-dialog';
import { MealFormDialog } from '@/app/dashboard/meals/components/meal-form-dialog';
import { MealDetailsDialog } from '@/app/dashboard/meals/components/meal-details-dialog';
import { PacketFormDialog } from '@/app/dashboard/packets/components/packet-form-dialog';
import { PacketDetailsDialog } from '@/app/dashboard/packets/components/packet-details-dialog';
import { createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { createMeal, deleteMeal, updateMeal } from '@/app/actions/meals';
import { createPacket, deletePacket, updatePacket } from '@/app/actions/packets';
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

interface NewDashboardProps {
  userEmail: string;
  ingredients: Ingredient[];
  meals: Meal[];
  packets: Packet[];
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
  const [localMeals, setLocalMeals] = useState<Meal[]>(meals || []);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [isEditMealDialogOpen, setIsEditMealDialogOpen] = useState(false);
  const [isMealDetailsDialogOpen, setIsMealDetailsDialogOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [currentMealId, setCurrentMealId] = useState<string | null>(null);
  const [isMealSubmitting, setIsMealSubmitting] = useState(false);

  // Packet management state
  const [localPackets, setLocalPackets] = useState<Packet[]>(packets || []);
  const [isAddPacketDialogOpen, setIsAddPacketDialogOpen] = useState(false);
  const [isEditPacketDialogOpen, setIsEditPacketDialogOpen] = useState(false);
  const [isPacketDetailsDialogOpen, setIsPacketDetailsDialogOpen] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<Packet | null>(null);
  const [currentPacketId, setCurrentPacketId] = useState<string | null>(null);
  const [isPacketSubmitting, setIsPacketSubmitting] = useState(false);

  // Add to cart state
  const [isAddToCartDialogOpen, setIsAddToCartDialogOpen] = useState(false);
  const [cartItemToAdd, setCartItemToAdd] = useState<{ item: Meal | Packet; type: 'meal' | 'packet' } | null>(null);

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

  const handleAddToCart = (item: Meal | Packet, type: 'meal' | 'packet') => {
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
    if (!data.id) return;
    
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
        toast.success('Ingredient updated successfully', {
          description: `${data.name} has been updated`
        });
      }
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      toast.error('Failed to update ingredient', {
        description: 'Please try again or check your input'
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
        setLocalIngredients(
          localIngredients.filter((item) => item.id !== currentIngredient.id)
        );
        setIsEditIngredientDialogOpen(false);
        toast.success('Ingredient deleted successfully', {
          description: `${currentIngredient.name} has been removed from your inventory`
        });
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

  const handleEditMeal = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsEditMealDialogOpen(true);
  };

  const handleViewMealDetails = (meal: Meal) => {
    setCurrentMealId(meal.id);
    setIsMealDetailsDialogOpen(true);
  };

  const handleCreateMeal = async (data: MealFormValues) => {
    setIsMealSubmitting(true);
    try {
      const result = await createMeal(data);
      if (result.success && result.data) {
        setLocalMeals([...localMeals, result.data as Meal]);
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
            item.id === data.id ? result.data as Meal : item
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

  const handleDeleteMeal = async (meal: Meal) => {
    setIsMealSubmitting(true);
    try {
      const result = await deleteMeal(meal.id);
      if (result.success) {
        setLocalMeals(
          localMeals.filter((item) => item.id !== meal.id)
        );
        toast.success('Meal deleted successfully', {
          description: `${meal.name} has been removed from your menu`
        });
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

  const handleEditPacket = (packet: Packet) => {
    setCurrentPacket(packet);
    setIsEditPacketDialogOpen(true);
  };

  const handleViewPacketDetails = (packet: Packet) => {
    setCurrentPacketId(packet.id);
    setIsPacketDetailsDialogOpen(true);
  };

  const handleCreatePacket = async (data: PacketFormValues) => {
    setIsPacketSubmitting(true);
    try {
      const result = await createPacket(data);
      if (result.success && result.data) {
        setLocalPackets([...localPackets, result.data as Packet]);
        setIsAddPacketDialogOpen(false);
        toast.success('Packet created successfully', {
          description: `${data.name} has been added to your packages`
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
            item.id === data.id ? result.data as Packet : item
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

  const handleDeletePacket = async (packet: Packet) => {
    setIsPacketSubmitting(true);
    try {
      const result = await deletePacket(packet.id);
      if (result.success) {
        setLocalPackets(
          localPackets.filter((item) => item.id !== packet.id)
        );
        toast.success('Packet deleted successfully', {
          description: `${packet.name} has been removed from your packages`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TooltipProvider>
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
                >
                  <Utensils className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Costify Pro
                  </h1>
                  <p className="text-sm text-muted-foreground">Professional Food Costing</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{stats.totalItems}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">Total Items</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Inventory Overview</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-green-600">{stats.ingredients}</div>
                            <div className="text-muted-foreground">Ingredients</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-blue-600">{stats.meals}</div>
                            <div className="text-muted-foreground">Meals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-purple-600">{stats.packets}</div>
                            <div className="text-muted-foreground">Packets</div>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{userEmail}</span>
                </div>
                
                <LogoutButton />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Layout */}
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 backdrop-blur-sm border-muted"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="ingredients" className="flex items-center space-x-2">
                    <Wheat className="h-4 w-4" />
                    <span>Ingredients</span>
                    <Badge variant="secondary" className="ml-1">{stats.ingredients}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="meals" className="flex items-center space-x-2">
                    <Utensils className="h-4 w-4" />
                    <span>Meals</span>
                    <Badge variant="secondary" className="ml-1">{stats.meals}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="packets" className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Packets</span>
                    <Badge variant="secondary" className="ml-1">{stats.packets}</Badge>
                  </TabsTrigger>
                </TabsList>

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
                      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                          whileHover={{ y: -2 }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 hover:shadow-md border-muted/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium truncate">
                                  {ingredient.name}
                                </CardTitle>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleEditIngredient(ingredient)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit ingredient</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Badge variant="outline" className="w-fit text-xs">
                                Ingredient
                              </Badge>
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

                {/* Meals Tab */}
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
                      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                          whileHover={{ y: -2 }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 hover:shadow-md border-muted/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{meal.name}</CardTitle>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleAddToCart(meal, 'meal')}
                                      >
                                        <ShoppingCart className="h-4 w-4" />
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
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleViewMealDetails(meal)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleEditMeal(meal)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit meal</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              {meal.description && (
                                <CardDescription className="text-sm line-clamp-2">
                                  {meal.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Created {new Date(meal.created_at).toLocaleDateString()}</span>
                                </div>
                                <Star className="h-4 w-4 text-yellow-500" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* Packets Tab */}
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
                      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                          whileHover={{ y: -2 }}
                          className="group"
                        >
                          <Card className="h-full transition-all duration-200 hover:shadow-md border-muted/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{packet.name}</CardTitle>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleAddToCart(packet, 'packet')}
                                      >
                                        <ShoppingCart className="h-4 w-4" />
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
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleViewPacketDetails(packet)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleEditPacket(packet)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit packet</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              {packet.description && (
                                <CardDescription className="text-sm line-clamp-2">
                                  {packet.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Created {new Date(packet.created_at).toLocaleDateString()}</span>
                                </div>
                                <Package className="h-4 w-4 text-purple-500" />
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
          onMealUpdated={(updatedMeal) => {
            setLocalMeals(
              localMeals.map((meal) => 
                meal.id === updatedMeal.id ? updatedMeal as Meal : meal
              )
            );
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
          onPacketUpdated={(updatedPacket) => {
            setLocalPackets(
              localPackets.map((packet) => 
                packet.id === updatedPacket.id ? updatedPacket as Packet : packet
              )
            );
          }}
        />
      </TooltipProvider>
    </div>
  );
} 