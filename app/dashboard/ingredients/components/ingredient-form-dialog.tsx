'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IngredientFormValues, ingredientSchema } from '@/app/lib/validation-schemas';
import { Ingredient } from '@/app/lib/pricing';
import { useTranslations } from '@/app/providers/language-provider';
import { Plus, Loader2, DollarSign, Package2 } from 'lucide-react';

// Common unit types for ingredients - will be dynamically translated
const UNIT_KEYS = [
  'kg', 'g', 'l', 'ml', 'pieces', 'tbsp', 'tsp', 'cup', 'package', 'can', 'bottle'
];

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IngredientFormValues) => void;
  defaultValues?: Ingredient;
  isSubmitting: boolean;
  title: string;
}

export function IngredientFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting,
  title
}: IngredientFormDialogProps) {
  const t = useTranslations();
  
  // Create unit options with translations
  const UNIT_OPTIONS = UNIT_KEYS.map(key => ({
    value: key,
    label: t(`units.${key}`)
  }));
  
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: defaultValues ? {
      id: defaultValues.id,
      name: defaultValues.name,
      unit: defaultValues.unit,
      price_net: defaultValues.price_net,
      category: defaultValues.category || undefined,
    } : {
      name: '',
      unit: '',
      price_net: 0,
    },
  });

  const handleSubmit = (data: IngredientFormValues) => {
    // If editing, ensure we pass the ID
    if (defaultValues) {
      data.id = defaultValues.id;
    }
    onSubmit(data);
  };

  const currentPrice = form.watch('price_net');
  const currentUnit = form.watch('unit');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            {title}
            {currentUnit && (
              <Badge variant="secondary" className="ml-2 font-mono">
                {currentUnit}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {defaultValues 
              ? t('ui.updateIngredientDetails')
              : t('ui.addNewIngredientToInventory')
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ui.name')} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Organic Flour, Fresh Basil" 
                        {...field} 
                        className="transition-all duration-200 focus:ring-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ingredients.unit')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 focus:ring-2">
                            <SelectValue placeholder={t('ui.selectUnitType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {UNIT_OPTIONS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price_net"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t('ui.pricePerUnit', { unit: currentUnit || t('ui.perUnit') })}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1.99"
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:ring-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {currentPrice > 0 && currentUnit && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                <div className="flex justify-between items-center text-sm">
                  <span>{t('ui.pricePreview')}</span>
                  <Badge variant="default" className="text-base font-mono">
                    €{Number(currentPrice).toFixed(2)} {t('ingredients.perUnit', { unit: currentUnit })}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {t('ui.thisWillBeUsedToCalculate')}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {defaultValues ? t('ui.updating') : t('ui.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {defaultValues ? t('ingredients.editIngredient') : t('ingredients.addIngredient')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
