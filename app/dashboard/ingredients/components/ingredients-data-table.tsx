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
import { MoreHorizontal, Pencil, Trash2, Copy, Eye } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { Ingredient } from '@/app/lib/pricing';
import { IngredientFormValues } from '@/app/lib/validation-schemas';
import { createIngredient, deleteIngredient, updateIngredient } from '@/app/actions/ingredients';
import { IngredientFormDialog } from './ingredient-form-dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
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

  const handleDuplicate = async (ingredient: Ingredient) => {
    const duplicateData: IngredientFormValues = {
      name: `${ingredient.name} (Copy)`,
      unit: ingredient.unit,
      price_net: Number(ingredient.price_net),
      category: ingredient.category,
    };
    
    setIsSubmitting(true);
    try {
      const result = await createIngredient(duplicateData);
      if (result.success && result.data) {
        setIngredients([...ingredients, result.data as Ingredient]);
        toast.success('Ingredient duplicated successfully', {
          description: `${duplicateData.name} has been created`
        });
      }
    } catch (error) {
      console.error('Failed to duplicate ingredient:', error);
      toast.error('Failed to duplicate ingredient', {
        description: 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewUsage = (ingredient: Ingredient) => {
    // TODO: Implement view usage in meals functionality
    console.log('View usage for ingredient:', ingredient.name);
    // This could navigate to a modal or page showing which meals use this ingredient
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
        setIsDeleteDialogOpen(false);
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(ingredient)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit ingredient
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(ingredient)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate ingredient
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewUsage(ingredient)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View usage in meals
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(ingredient)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete ingredient
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
