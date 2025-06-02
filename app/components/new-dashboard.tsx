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
import { IngredientEditDialog } from '@/app/dashboard/ingredients/components/ingredient-edit-dialog';
import { IngredientFormDialog } from '@/app/dashboard/ingredients/components/ingredient-form-dialog';
import { createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { IngredientFormValues } from '@/app/lib/validation-schemas';
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
  created_at: string;
}

interface Packet {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safety check to prevent undefined errors
  const safeCartItems = cartItems || [];
  const safeIngredients = localIngredients || [];
  const safeMeals = meals || [];
  const safePackets = packets || [];

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
    cartItems: safeCartItems.length
  };

  const handleAddToCart = async (item: Meal | Packet, type: 'meal' | 'packet') => {
    try {
      await addItem(type, item.id, 20); // Default 20% markup
      toast.success(`Added ${item.name} to cart`, {
        description: `${type} added with 20% markup`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart', {
        description: 'Please try again'
      });
    }
  };

  // Ingredient management handlers
  const handleAddIngredient = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setIsEditDialogOpen(true);
  };

  const handleCreateIngredient = async (data: IngredientFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createIngredient(data);
      if (result.success && result.data) {
        setLocalIngredients([...localIngredients, result.data as Ingredient]);
        setIsAddDialogOpen(false);
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
      setIsSubmitting(false);
    }
  };

  const handleUpdateIngredient = async (data: IngredientFormValues) => {
    if (!data.id) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateIngredient(data);
      if (result.success && result.data) {
        setLocalIngredients(
          localIngredients.map((item) => 
            item.id === data.id ? result.data as Ingredient : item
          )
        );
        setIsEditDialogOpen(false);
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
      setIsSubmitting(false);
    }
  };

  const handleDeleteIngredient = async () => {
    if (!currentIngredient) return;
    
    setIsSubmitting(true);
    try {
      const result = await deleteIngredient(currentIngredient.id);
      if (result.success) {
        setLocalIngredients(
          localIngredients.filter((item) => item.id !== currentIngredient.id)
        );
        setIsEditDialogOpen(false);
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
      setIsSubmitting(false);
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
                    <Button size="sm" className="flex items-center space-x-2">
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
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details</p>
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
                    <Button size="sm" className="flex items-center space-x-2">
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
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details</p>
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
        
        {/* Ingredient Management Dialogs */}
        <IngredientFormDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleCreateIngredient}
          isSubmitting={isSubmitting}
          title="Add New Ingredient"
        />

        {currentIngredient && (
          <IngredientEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            ingredient={currentIngredient}
            onSave={handleUpdateIngredient}
            onDelete={handleDeleteIngredient}
            isSubmitting={isSubmitting}
          />
        )}
      </TooltipProvider>
    </div>
  );
} 