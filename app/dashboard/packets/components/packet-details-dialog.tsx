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
import { PacketFormValues, packetSchema } from '@/app/lib/validation-schemas';
import { Packet, Meal, MealWithQuantity, MealWithIngredients, IngredientWithQuantity } from '@/app/lib/pricing';
import { calcPacketNet, calcMealNet } from '@/app/lib/pricing';
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
}

interface PacketWithMeals extends Packet {
  meals: Array<MealWithIngredients & { quantity: number }>;
}

export function PacketDetailsDialog({
  open,
  onOpenChange,
  packetId,
  onPacketUpdated
}: PacketDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packet, setPacket] = useState<PacketWithMeals | null>(null);
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [mealQuantity, setMealQuantity] = useState<number>(1);

  const form = useForm<PacketFormValues>({
    resolver: zodResolver(packetSchema),
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
      setAvailableMeals(meals as Meal[]);
    } catch (error) {
      console.error('Failed to load meals:', error);
    }
  };

  const handleSavePacket = async (data: PacketFormValues) => {
    if (!packet) return;
    
    setIsSubmitting(true);
    try {
      const result = await updatePacket(data);
      if (result.success && result.data) {
        const updatedPacket = { ...packet, ...result.data };
        setPacket(updatedPacket as PacketWithMeals);
        if (onPacketUpdated) {
          onPacketUpdated(result.data as Packet);
        }
        toast.success('Packet updated successfully');
      }
    } catch (error) {
      console.error('Failed to update packet:', error);
      toast.error('Failed to update packet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMeal = async () => {
    if (!packet || !selectedMealId || mealQuantity <= 0) return;

    try {
      await addPacketMeal(packet.id, selectedMealId, mealQuantity);
      await loadPacketData(); // Reload to get updated data
      setSelectedMealId('');
      setMealQuantity(1);
      toast.success('Meal added to packet');
    } catch (error) {
      console.error('Failed to add meal:', error);
      toast.error('Failed to add meal');
    }
  };

  const handleUpdateMealQuantity = async (mealId: string, newQuantity: number) => {
    if (!packet || newQuantity <= 0) return;

    try {
      await updatePacketMeal(packet.id, mealId, newQuantity);
      await loadPacketData(); // Reload to get updated data
      toast.success('Meal quantity updated');
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error('Failed to update meal');
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!packet) return;

    try {
      await removePacketMeal(packet.id, mealId);
      await loadPacketData(); // Reload to get updated data
      toast.success('Meal removed from packet');
    } catch (error) {
      console.error('Failed to remove meal:', error);
      toast.error('Failed to remove meal');
    }
  };

  // Calculate costs (simplified since we don't have full meal ingredient data)
  const packetNetCost = packet?.price_net_override || (packet ? calcPacketNet(packet, packet.meals as any) : 0);
  const totalMealsCost = packet ? packet.meals.reduce((total, meal) => {
    const mealPrice = meal.price_net_override || calcMealNet(meal, meal.ingredients || []);
    return total + (mealPrice * meal.quantity);
  }, 0) : 0;

  if (!packet && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Packet Details - {packet?.name || 'Loading...'}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading packet details...</p>
            </div>
          </div>
        ) : packet ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Basic Info</TabsTrigger>
              <TabsTrigger value="meals">Meals & Costs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="flex-1 overflow-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSavePacket)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Packet Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Weekend Family Package" {...field} />
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
                            placeholder="Describe the packet..."
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
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Leave empty to calculate from meals"
                            {...field}
                            value={field.value || ''}
                          />
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
                          <span>Total Meals Base Cost:</span>
                          <Badge variant="outline">€{totalMealsCost.toFixed(2)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Final Packet Cost:</span>
                          <Badge variant="default">€{packetNetCost.toFixed(2)}</Badge>
                        </div>
                        {packet.price_net_override && (
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
            
            <TabsContent value="meals" className="flex-1 overflow-auto space-y-4">
              {/* Add Meal Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Meal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedMealId} onValueChange={setSelectedMealId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select meal" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMeals
                          .filter(meal => !packet.meals.find(pm => pm.id === meal.id))
                          .map((meal) => (
                            <SelectItem key={meal.id} value={meal.id}>
                              {meal.name} {meal.price_net_override && `- €${meal.price_net_override.toFixed(2)}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={mealQuantity}
                      onChange={(e) => setMealQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-20"
                    />
                    <Button 
                      onClick={handleAddMeal}
                      disabled={!selectedMealId || mealQuantity <= 0}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Meals List */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Meals</CardTitle>
                  <CardDescription>
                    Manage the meals in this packet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {packet.meals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No meals added yet. Add some meals to create your packet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Meal</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packet.meals.map((meal) => (
                          <TableRow key={meal.id}>
                            <TableCell className="font-medium">{meal.name}</TableCell>
                            <TableCell>{meal.description || '-'}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={meal.quantity}
                                onChange={(e) => 
                                  handleUpdateMealQuantity(meal.id, Number(e.target.value))
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              €{(meal.price_net_override || calcMealNet(meal, meal.ingredients)).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{((meal.price_net_override || calcMealNet(meal, meal.ingredients)) * meal.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMeal(meal.id)}
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
            onClick={form.handleSubmit(handleSavePacket)}
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