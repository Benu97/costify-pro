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
import { MealWithIngredients } from '@/app/lib/pricing';
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
  initialMeals: MealWithIngredients[];
}

export default function MealsDataTable({ initialMeals }: MealsDataTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [meals, setMeals] = useState<MealWithIngredients[]>(initialMeals);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<MealWithIngredients | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleEdit = (meal: MealWithIngredients) => {
    setCurrentMeal(meal);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (meal: MealWithIngredients) => {
    setCurrentMeal(meal);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (meal: MealWithIngredients) => {
    setCurrentMeal(meal);
    setIsDetailsDialogOpen(true);
  };

  const handleAddToCart = (meal: MealWithIngredients) => {
    setCurrentMeal(meal);
    setIsCartDialogOpen(true);
  };

  const handleCartSubmit = async (meal: MealWithIngredients, quantity: number, markupPercentage: number) => {
    // TODO: Implement actual cart functionality
    console.log('Adding to cart:', { meal: meal.name, quantity, markupPercentage });
    // This should integrate with your cart context/state management
  };

  const handleDuplicate = async (meal: MealWithIngredients) => {
    const duplicateData: MealFormValues = {
      name: `${meal.name} (Copy)`,
      description: meal.description,
      price_net_override: meal.price_net_override,
    };
    
    setIsSubmitting(true);
    try {
      const result = await createMeal(duplicateData);
      if (result.success && result.data) {
        // Note: The duplicated meal won't have ingredients, we'd need to refetch or handle this separately
        setMeals([...meals, { ...result.data, ingredients: [] } as MealWithIngredients]);
        toast.success(t('messages.mealDuplicatedSuccessfully'), {
          description: t('messages.mealCreatedDescription', { name: duplicateData.name })
        });
      }
    } catch (error) {
      console.error('Failed to duplicate meal:', error);
      toast.error(t('messages.failedToDuplicateMeal'), {
        description: t('messages.pleaseRetry')
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
        setMeals([...meals, { ...result.data, ingredients: [] } as MealWithIngredients]);
        setIsAddDialogOpen(false);
        toast.success(t('messages.mealCreatedSuccessfully'), {
          description: t('messages.mealAddedDescription', { name: data.name })
        });
      }
    } catch (error) {
      console.error('Failed to create meal:', error);
      toast.error(t('messages.failedToCreateMeal'), {
        description: t('messages.pleaseRetryOrCheckInput')
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
            item.id === data.id ? { ...item, ...result.data } : item
          )
        );
        setIsEditDialogOpen(false);
        toast.success(t('messages.mealUpdatedSuccessfully'), {
          description: t('messages.mealUpdatedDescription', { name: data.name })
        });
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error(t('messages.failedToUpdateMeal'), {
        description: t('messages.pleaseRetryOrCheckInput')
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
        toast.success(t('messages.mealDeletedSuccessfully'), {
          description: t('messages.mealRemovedDescription', { name: currentMeal.name })
        });
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast.error(t('messages.failedToDeleteMeal'), {
        description: t('messages.pleaseRetry')
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
                    {formatPrice(calculateMealPrice(meal, meal.ingredients))}
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
              setMeals(meals.map(m => m.id === updatedMeal.id ? { ...m, ...updatedMeal } : m));
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
