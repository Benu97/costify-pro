'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye, Copy, ShoppingCart } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { Meal } from '@/app/lib/pricing';
import { MealFormValues } from '@/app/lib/validation-schemas';
import { createMeal, deleteMeal, updateMeal } from '@/app/actions/meals';
import { MealFormDialog } from './meal-form-dialog';
import { MealDetailsDialog } from './meal-details-dialog';
import { AddToCartDialog } from './add-to-cart-dialog';
import { ConfirmDeleteDialog } from '@/app/dashboard/ingredients/components/confirm-delete-dialog';
import { FavoriteButton } from '@/app/components/favorite-button';
import { calculateMealPrice, formatPrice } from '@/app/lib/price-utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from '@/app/providers/language-provider';

interface MealsDataTableProps {
  initialMeals: Meal[];
}

export default function MealsDataTable({ initialMeals }: MealsDataTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleEdit = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsDetailsDialogOpen(true);
  };

  const handleAddToCart = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsCartDialogOpen(true);
  };

  const handleCartSubmit = async (meal: Meal, quantity: number, markupPercentage: number) => {
    // TODO: Implement actual cart functionality
    console.log('Adding to cart:', { meal: meal.name, quantity, markupPercentage });
    // This should integrate with your cart context/state management
  };

  const handleDuplicate = async (meal: Meal) => {
    const duplicateData: MealFormValues = {
      name: `${meal.name} (Copy)`,
      description: meal.description,
      price_net_override: meal.price_net_override,
    };
    
    setIsSubmitting(true);
    try {
      const result = await createMeal(duplicateData);
      if (result.success && result.data) {
        setMeals([...meals, result.data as Meal]);
        toast.success('Meal duplicated successfully', {
          description: `${duplicateData.name} has been created`
        });
      }
    } catch (error) {
      console.error('Failed to duplicate meal:', error);
      toast.error('Failed to duplicate meal', {
        description: 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMeal = async (data: MealFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createMeal(data);
      if (result.success && result.data) {
        setMeals([...meals, result.data as Meal]);
        setIsAddDialogOpen(false);
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
      setIsSubmitting(false);
    }
  };

  const handleUpdateMeal = async (data: MealFormValues) => {
    if (!data.id) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateMeal(data);
      if (result.success && result.data) {
        setMeals(
          meals.map((item) => 
            item.id === data.id ? result.data as Meal : item
          )
        );
        setIsEditDialogOpen(false);
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
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!currentMeal) return;
    
    setIsSubmitting(true);
    try {
      const result = await deleteMeal(currentMeal.id);
      if (result.success) {
        setMeals(
          meals.filter((item) => item.id !== currentMeal.id)
        );
        setIsDeleteDialogOpen(false);
        toast.success('Meal deleted successfully', {
          description: `${currentMeal.name} has been removed from your menu`
        });
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast.error('Failed to delete meal', {
        description: 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <CrudToolbar 
        title="Meals" 
        onAddNew={handleAddNew} 
        onRefresh={handleRefresh} 
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Base Price (€)</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No meals found. Create your first meal!
                </TableCell>
              </TableRow>
            ) : (
              meals.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell>{meal.name}</TableCell>
                  <TableCell>{meal.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(calculateMealPrice(meal))}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <FavoriteButton
                        id={meal.id}
                        type="meal"
                        name={meal.name}
                        size="icon"
                        className="h-8 w-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(meal)}
                        className="h-8"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(meal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('ui.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(meal)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit meal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(meal)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate meal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(meal)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete meal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MealFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateMeal}
        isSubmitting={isSubmitting}
        title="Add New Meal"
      />

      {currentMeal && (
        <>
          <MealFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            defaultValues={currentMeal}
            onSubmit={handleUpdateMeal}
            isSubmitting={isSubmitting}
            title="Edit Meal"
          />

          <MealDetailsDialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            mealId={currentMeal.id}
            onMealUpdated={(updatedMeal) => {
              setMeals(meals.map(m => m.id === updatedMeal.id ? updatedMeal : m));
            }}
          />

          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteMeal}
            isSubmitting={isSubmitting}
            itemName={currentMeal.name}
            itemType="meal"
          />

          <AddToCartDialog
            open={isCartDialogOpen}
            onOpenChange={setIsCartDialogOpen}
            meal={currentMeal}
            onAddToCart={handleCartSubmit}
          />
        </>
      )}
    </div>
  );
}
