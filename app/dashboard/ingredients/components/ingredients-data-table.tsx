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
import { Ingredient } from '@/app/lib/pricing';
import { IngredientFormValues, createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { IngredientFormDialog } from './ingredient-form-dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import { useRouter } from 'next/navigation';

interface IngredientsDataTableProps {
  initialIngredients: Ingredient[];
}

export default function IngredientsDataTable({ initialIngredients }: IngredientsDataTableProps) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleEdit = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateIngredient = async (data: IngredientFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createIngredient(data);
      if (result.success && result.data) {
        setIngredients([...ingredients, result.data as Ingredient]);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create ingredient:', error);
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
        setIngredients(
          ingredients.map((item) => 
            item.id === data.id ? result.data as Ingredient : item
          )
        );
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update ingredient:', error);
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
        setIngredients(
          ingredients.filter((item) => item.id !== currentIngredient.id)
        );
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <CrudToolbar 
        title="Ingredients" 
        onAddNew={handleAddNew} 
        onRefresh={handleRefresh} 
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price (€)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No ingredients found. Create your first ingredient!
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>{ingredient.name}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell className="text-right">
                    {parseFloat(ingredient.price_net.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ingredient)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ingredient)}
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

      <IngredientFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateIngredient}
        isSubmitting={isSubmitting}
        title="Add New Ingredient"
      />

      {currentIngredient && (
        <>
          <IngredientFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            defaultValues={currentIngredient}
            onSubmit={handleUpdateIngredient}
            isSubmitting={isSubmitting}
            title="Edit Ingredient"
          />

          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteIngredient}
            isSubmitting={isSubmitting}
            itemName={currentIngredient.name}
            itemType="ingredient"
          />
        </>
      )}
    </div>
  );
}
