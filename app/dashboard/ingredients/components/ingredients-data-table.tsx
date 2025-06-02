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

import { Edit } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { Ingredient } from '@/app/lib/pricing';
import { IngredientFormValues } from '@/app/lib/validation-schemas';
import { createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { IngredientFormDialog } from './ingredient-form-dialog';
import { IngredientEditDialog } from './ingredient-edit-dialog';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface IngredientsDataTableProps {
  initialIngredients: Ingredient[];
}

export default function IngredientsDataTable({ initialIngredients }: IngredientsDataTableProps) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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



  const handleCreateIngredient = async (data: IngredientFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createIngredient(data);
      if (result.success && result.data) {
        setIngredients([...ingredients, result.data as Ingredient]);
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
        setIngredients(
          ingredients.map((item) => 
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
        setIngredients(
          ingredients.filter((item) => item.id !== currentIngredient.id)
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
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price (€)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No ingredients found. Create your first ingredient!
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>{ingredient.name}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{ingredient.category || '-'}</TableCell>
                  <TableCell className="text-right">
                    {parseFloat(ingredient.price_net.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(ingredient)}
                        className="h-9 px-3 bg-blue-50 border-blue-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        EDIT INGREDIENT
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
        <IngredientEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          ingredient={currentIngredient}
          onSave={handleUpdateIngredient}
          onDelete={handleDeleteIngredient}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
