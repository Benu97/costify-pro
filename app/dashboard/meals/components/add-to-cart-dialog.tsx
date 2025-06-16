'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MealWithIngredients } from '@/app/lib/pricing';
import { calculateMealPrice } from '@/app/lib/price-utils';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/app/providers/language-provider';

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealWithIngredients | null;
  onAddToCart?: (meal: MealWithIngredients, quantity: number, markupPercentage: number) => void;
}

export function AddToCartDialog({ 
  open, 
  onOpenChange, 
  meal,
  onAddToCart 
}: AddToCartDialogProps) {
  const t = useTranslations();
  const [quantity, setQuantity] = useState(1);
  const [markupPercentage, setMarkupPercentage] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setMarkupPercentage('');
    }
  }, [open]);

  if (!meal) return null;

  // Calculate base price (from ingredients or override)
  const basePrice = calculateMealPrice(meal, meal.ingredients);
  const hasValidPrice = meal.price_net_override !== null || basePrice > 0;
  
  // Calculate prices with markup
  const markupDecimal = typeof markupPercentage === 'number' ? markupPercentage / 100 : 0;
  const netPricePerUnit = basePrice * (1 + markupDecimal);
  const totalNetPrice = netPricePerUnit * quantity;
  const grossPricePerUnit = netPricePerUnit * 1.19; // Assuming 19% VAT
  const totalGrossPrice = grossPricePerUnit * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 999) {
      setQuantity(newQuantity);
    }
  };

  const handleMarkupChange = (value: string) => {
    if (value === '') {
      setMarkupPercentage('');
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
        setMarkupPercentage(numValue);
      }
    }
  };

  const handleAddToCart = async () => {
    if (markupPercentage === '') {
      toast.error(t('ui.markupPercentageRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (onAddToCart) {
        await onAddToCart(meal, quantity, typeof markupPercentage === 'number' ? markupPercentage : 0);
      }
      
      toast.success(t('cart.addedToCart'), {
        description: t('cart.itemAddedDescription', { quantity, name: meal.name })
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(t('ui.failedToAddToCart'), {
        description: t('ui.pleaseRetry')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('cart.addToCart')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meal Info */}
          <div>
            <h3 className="font-semibold text-lg">{meal.name}</h3>
            {meal.description && (
              <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('ui.quantity')}</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                className="w-20 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 999}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Markup Percentage */}
          <div className="space-y-2">
            <Label htmlFor="markup">{t('ui.markupPercentage')}</Label>
            <Input
              id="markup"
              type="number"
              value={markupPercentage}
              onChange={(e) => handleMarkupChange(e.target.value)}
              placeholder={t('ui.markupPercentagePlaceholder')}
              min="0"
              max="1000"
              step="0.1"
              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('ui.markupPercentageHelp')}
            </p>
          </div>

          {/* Price Preview */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">{t('ui.priceCalculation')}</h4>
            {!hasValidPrice && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ {t('ui.noPriceWarning')}
                </p>
              </div>
            )}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{t('ui.basePricePerUnit')}:</span>
                <span>{hasValidPrice ? `€${basePrice.toFixed(2)}` : 'N/A'}</span>
              </div>
              {typeof markupPercentage === 'number' && hasValidPrice && (
                <>
                  <div className="flex justify-between">
                    <span>{t('ui.withMarkup', { markup: markupPercentage })}:</span>
                    <span>€{netPricePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('ui.netTotal', { quantity })}:</span>
                    <span className="font-medium">€{totalNetPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>{t('ui.grossTotal')}:</span>
                    <span className="font-semibold">€{totalGrossPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('ui.cancel')}
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={isSubmitting || markupPercentage === '' || !hasValidPrice}
            className="min-w-[100px]"
          >
            {isSubmitting ? t('cart.adding') : t('cart.addToCart')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 