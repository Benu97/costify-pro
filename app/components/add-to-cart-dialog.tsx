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
import { calculateMealPrice } from '@/app/lib/price-utils';
import { toast } from 'sonner';

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { id: string; name: string; description?: string | null; price_net_override?: number | null; price_net?: number } | null;
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
  const [quantity, setQuantity] = useState(1);
  const [markupPct, setMarkupPct] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      setQuantity(1);
      setMarkupPct('');
    }
  }, [open, item]);

  if (!item || !itemType) return null;

  // Calculate base price (simplified for now)
  const basePrice = itemType === 'meal' 
    ? calculateMealPrice(item as any) // Type assertion since we know it's a meal
    : itemType === 'service'
    ? (item.price_net || 0) // For services, use direct price
    : (item.price_net_override || 0); // For packets, use override or 0
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
    if (markupPct === '') {
      toast.error('Markup percentage is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddToCart(item.id, itemType, quantity, typeof markupPct === 'number' ? markupPct : 0);
      
      toast.success('Added to cart', {
        description: `${quantity}x ${item.name} added to your cart`
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart', {
        description: 'Please try again'
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
            Add to Cart
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
                {itemType === 'meal' ? 'Meal' : itemType === 'service' ? 'Service' : 'Packet'}
              </Badge>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
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
                className="w-20 text-center"
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
            <Label htmlFor="markup">Markup Percentage (%) *</Label>
            <Input
              id="markup"
              type="number"
              value={markupPct}
              onChange={(e) => handleMarkupChange(e.target.value)}
              placeholder="Enter markup percentage"
              min="0"
              max="1000"
              step="0.1"
              required
            />
            <p className="text-xs text-muted-foreground">
              Required field. Enter 0 for no markup.
            </p>
          </div>

          {/* Price Preview */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Price Calculation</h4>
              {!hasValidPrice && itemType === 'meal' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This meal has no price set and no ingredients to calculate from. 
                    Please add ingredients or set a price override before adding to cart.
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base price per unit:</span>
                  <span>{hasValidPrice ? `€${basePrice.toFixed(2)}` : 'N/A'}</span>
                </div>
                {typeof markupPct === 'number' && hasValidPrice && (
                  <>
                    <div className="flex justify-between">
                      <span>With markup ({markupPct}%):</span>
                      <span>€{pricePerUnit.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total ({quantity}x):</span>
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
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={isSubmitting || markupPct === '' || !hasValidPrice}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Adding...' : 'Add to Cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 