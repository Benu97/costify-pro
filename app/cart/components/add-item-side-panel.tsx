'use client';

import { useState } from 'react';
import { useCart } from '@/app/providers/cart-provider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  type: 'meal' | 'packet';
}

interface AddItemSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: SearchResult | null;
}

export default function AddItemSidePanel({
  open,
  onOpenChange,
  selectedItem
}: AddItemSidePanelProps) {
  const { addItem } = useCart();
  const [markupPct, setMarkupPct] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = async () => {
    if (!selectedItem) return;
    
    setIsAdding(true);
    try {
      await addItem(selectedItem.type, selectedItem.id, markupPct);
      onOpenChange(false);
      setMarkupPct(0);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add to Cart</SheetTitle>
          <SheetDescription>
            {selectedItem ? `Adding ${selectedItem.name} to your cart` : 'Select an item to add'}
          </SheetDescription>
        </SheetHeader>
        
        {selectedItem && (
          <div className="py-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedItem.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description || 'No description available'}
                </p>
                <div className="mt-1">
                  <span className="capitalize inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                    {selectedItem.type}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="markup">Markup Percentage (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  min="0"
                  step="0.1"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  The markup percentage will be applied to the item&apos;s net price.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart} disabled={isAdding || !selectedItem}>
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
