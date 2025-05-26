'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CartSummary } from '@/app/providers/cart-provider';

interface SaveQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartSummary: CartSummary;
  itemCount: number;
  onSaveQuote?: (quoteName: string, notes: string) => Promise<void>;
}

export function SaveQuoteDialog({ 
  open, 
  onOpenChange, 
  cartSummary, 
  itemCount,
  onSaveQuote 
}: SaveQuoteDialogProps) {
  const [quoteName, setQuoteName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate default quote name
  const generateDefaultName = () => {
    const date = new Date().toLocaleDateString();
    return `Quote - ${date}`;
  };

  const handleSave = async () => {
    if (!quoteName.trim()) {
      toast.error('Quote name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSaveQuote) {
        await onSaveQuote(quoteName.trim(), notes.trim());
      }
      
      toast.success('Quote saved successfully', {
        description: `${quoteName} has been saved to your quotes`
      });
      
      // Reset form and close dialog
      setQuoteName('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save quote:', error);
      toast.error('Failed to save quote', {
        description: 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      // Set default name when opening
      setQuoteName(generateDefaultName());
    } else {
      // Reset form when closing
      setQuoteName('');
      setNotes('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Quote
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quote Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <Badge variant="outline">{itemCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Total:</span>
                  <span className="font-medium">€{cartSummary.nettoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Markup:</span>
                  <Badge variant="outline">
                    {cartSummary.avgMarkupPct.toFixed(1)}%
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Gross Total:</span>
                  <span className="text-green-600">€{cartSummary.bruttoTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Name */}
          <div className="space-y-2">
            <Label htmlFor="quoteName">Quote Name *</Label>
            <Input
              id="quoteName"
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              placeholder="Enter a name for this quote"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will help you identify the quote later
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this quote..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Client details, special requirements, etc.
            </p>
          </div>

          {/* Benefits Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              What happens next?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Quote will be saved to your quotes history</li>
              <li>• Cart will be cleared for new planning</li>
              <li>• You can export saved quotes as PDF later</li>
              <li>• Quote includes current markup and pricing</li>
            </ul>
          </div>
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
            onClick={handleSave}
            disabled={isSubmitting || !quoteName.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 