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
import { Pencil, Trash2 } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { Meal } from '@/app/lib/pricing';
import { MealFormValues, createMeal, deleteMeal, updateMeal } from '@/app/actions/meals';
import { MealFormDialog } from './meal-form-dialog';
import { ConfirmDeleteDialog } from '@/app/dashboard/ingredients/components/confirm-delete-dialog';
import { useRouter } from 'next/navigation';

interface MealsDataTableProps {
  initialMeals: Meal[];
}

export default function MealsDataTable({ initialMeals }: MealsDataTableProps) {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleCreateMeal = async (data: MealFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createMeal(data);
      if (result.success && result.data) {
        setMeals([...meals, result.data as Meal]);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create meal:', error);
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
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
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
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
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
              <TableHead className="text-right">Price Override (€)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
                    {meal.price_net_override 
                      ? parseFloat(meal.price_net_override.toString()).toFixed(2) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(meal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(meal)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteMeal}
            isSubmitting={isSubmitting}
            itemName={currentMeal.name}
            itemType="meal"
          />
        </>
      )}
    </div>
  );
}
