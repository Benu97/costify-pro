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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Package, Utensils, Wrench } from 'lucide-react';
import { calculateMealPrice, calculatePacketPrice } from '@/app/lib/price-utils';
import { MealWithIngredients, Service, PacketWithMeals } from '@/app/lib/pricing';
import { toast } from 'sonner';
import { useTranslations } from '@/app/providers/language-provider';

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MealWithIngredients | PacketWithMeals | Service | null;
  itemType: 'meal' | 'packet' | 'service' | null;
  onAddToCart: (itemId: string, itemType: 'meal' | 'packet' | 'service', quantity: number, markupPct: number) => Promise<void>;
}

export function AddToCartDialog({ 
  open, 
  onOpenChange, 
  item,
  itemType,
  onAddToCart 
}: AddToCartDialogProps) {
  const t = useTranslations();
  const [quantity, setQuantity] = useState(1);
  const [markupPct, setMarkupPct] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      setQuantity(1);
      setMarkupPct(itemType === 'service' ? 0 : '');
    }
  }, [open, item, itemType]);

  if (!item || !itemType) return null;

  // Calculate base price with proper type handling
  const basePrice = (() => {
    if (itemType === 'meal') {
      const meal = item as MealWithIngredients;
      return calculateMealPrice(meal, meal.ingredients);
    } else if (itemType === 'service') {
      const service = item as Service;
      return service.price_net;
    } else if (itemType === 'packet') {
      const packet = item as PacketWithMeals;
      return calculatePacketPrice(packet, packet.meals);
    }
    return 0;
  })();
  
  const hasValidPrice = basePrice > 0;
  
  // Calculate prices with markup
  const markupDecimal = typeof markupPct === 'number' ? markupPct / 100 : 0;
  const pricePerUnit = basePrice * (1 + markupDecimal);
  const totalPrice = pricePerUnit * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 999) {
      setQuantity(newQuantity);
    }
  };

  const handleMarkupChange = (value: string) => {
    if (value === '') {
      setMarkupPct('');
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
        setMarkupPct(numValue);
      }
    }
  };

  const handleAddToCart = async () => {
    if (itemType !== 'service' && markupPct === '') {
      toast.error(t('cart.markupRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const finalMarkup = itemType === 'service' ? 0 : (typeof markupPct === 'number' ? markupPct : 0);
      await onAddToCart(item.id, itemType, quantity, finalMarkup);
      
      toast.success(t('ui.addedToCartSuccess'), {
        description: t('ui.addedToCartDescription', { quantity, name: item.name })
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
          {/* Item Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              {itemType === 'meal' ? (
                <Utensils className="h-5 w-5 text-blue-600" />
              ) : itemType === 'service' ? (
                <Wrench className="h-5 w-5 text-orange-600" />
              ) : (
                <Package className="h-5 w-5 text-purple-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              <Badge variant="outline" className="mt-2">
                {itemType === 'meal' ? t('ui.mealType') : itemType === 'service' ? t('ui.serviceType') : t('ui.packetType')}
              </Badge>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('cart.quantity')}</Label>
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

          {/* Markup Percentage - Hide for services */}
          {itemType !== 'service' && (
            <div className="space-y-2">
              <Label htmlFor="markup">{t('cart.markupPercentage')} *</Label>
              <Input
                id="markup"
                type="number"
                value={markupPct}
                onChange={(e) => handleMarkupChange(e.target.value)}
                placeholder={t('ui.enterMarkupPercentage')}
                min="0"
                max="1000"
                step="0.1"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('ui.requiredFieldEnterZero')}
              </p>
            </div>
          )}

          {/* Price Preview */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">{t('cart.priceCalculation')}</h4>
              {!hasValidPrice && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3">
                  <p className="text-sm text-yellow-800">
                    {itemType === 'meal' 
                      ? t('ui.noPriceWarning')
                      : itemType === 'packet'
                      ? t('ui.noPacketPriceWarning')
                      : t('ui.noServicePriceWarning')
                    }
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('ui.basePricePerUnitColon')}</span>
                  <span>{hasValidPrice ? `€${basePrice.toFixed(2)}` : t('ui.notAvailable')}</span>
                </div>
                {((typeof markupPct === 'number' && itemType !== 'service') || itemType === 'service') && hasValidPrice && (
                  <>
                    {itemType !== 'service' && (
                      <div className="flex justify-between">
                        <span>{t('ui.withMarkupPercent', { markup: markupPct })}</span>
                        <span>€{pricePerUnit.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{t('ui.totalQuantity', { quantity })}</span>
                      <span className="text-green-600">€{totalPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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
            disabled={isSubmitting || (itemType !== 'service' && markupPct === '') || !hasValidPrice}
            className="min-w-[100px]"
          >
            {isSubmitting ? t('cart.adding') : t('cart.addToCart')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 