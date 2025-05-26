'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/app/providers/cart-provider';
import { generateCartPDF, CartItemForPDF, CartSummaryForPDF } from '@/app/lib/pdf-export';
import { SaveQuoteDialog } from './save-quote-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Trash2, 
  Package,
  Utensils,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Minus,
  Edit,
  Receipt,
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function CartSidebar() {
  const { cart, cartItems, isLoading, cartSummary, updateItem, removeItem, finalizeCurrentCart } = useCart();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editMarkup, setEditMarkup] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaveQuoteDialogOpen, setIsSaveQuoteDialogOpen] = useState(false);

  const handleEditMarkup = (itemId: string, currentMarkup: number) => {
    setEditingItemId(itemId);
    setEditMarkup(currentMarkup);
  };

  const handleSaveMarkup = async () => {
    if (editingItemId) {
      try {
        await updateItem(editingItemId, editMarkup);
        setEditingItemId(null);
        toast.success('Markup updated successfully');
      } catch (error) {
        toast.error('Failed to update markup');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditMarkup(0);
  };

  const handleFinalizeCart = () => {
    setIsSaveQuoteDialogOpen(true);
  };

  const handleSaveQuote = async (quoteName: string, notes: string) => {
    // For now, just finalize the cart - in the future this would save to a quotes table
    await finalizeCurrentCart();
    // TODO: Implement quote saving to database with quoteName and notes
  };

  const handleExportPDF = () => {
    try {
      // Convert cart items to PDF format
      const pdfItems: CartItemForPDF[] = cartItems.map(item => ({
        id: item.id,
        name: item.details?.name || 'Unknown Item',
        description: item.details?.description,
        type: item.item_type as 'meal' | 'packet',
        quantity: 1, // Cart items don't have quantity - each row is one item
        basePrice: item.netPrice / (1 + item.markup_pct / 100), // Calculate base price from net price
        markupPct: item.markup_pct,
        netPrice: item.netPrice,
        grossPrice: item.grossPrice
      }));

      // Convert cart summary to PDF format
      const pdfSummary: CartSummaryForPDF = {
        nettoTotal: cartSummary.nettoTotal,
        avgMarkupPct: cartSummary.avgMarkupPct,
        bruttoTotal: cartSummary.bruttoTotal,
        itemCount: cartItems.length
      };

      // Generate and download PDF
      generateCartPDF(pdfItems, pdfSummary);
      
      toast.success('PDF exported successfully', {
        description: 'Your quote has been downloaded'
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF', {
        description: 'Please try again'
      });
    }
  };

  return (
    <motion.aside
      initial={{ x: 100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? '60px' : '400px'
      }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 h-screen border-l bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Shopping Cart</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </motion.div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isCollapsed ? 'Expand' : 'Collapse'} cart</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex-1 p-2 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 cursor-pointer">
                  <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {cartItems.length}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{cartItems.length} items in cart</p>
              </TooltipContent>
            </Tooltip>
            
            {cartItems.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-8 p-0"
                    onClick={handleFinalizeCart}
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Finalize cart (€{cartSummary.bruttoTotal.toFixed(2)})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4"
                >
                  <div className="p-4 rounded-full bg-muted/50">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground">Cart is empty</h3>
                    <p className="text-sm text-muted-foreground">Add meals or packets to get started</p>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <Card className="p-3 transition-all hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-lg bg-muted/50">
                                {item.item_type === 'meal' ? (
                                  <Utensils className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Package className="h-4 w-4 text-purple-600" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {item.details?.name || 'Unknown Item'}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.details?.description || `${item.item_type}`}
                                </p>
                                
                                {editingItemId === item.id ? (
                                  <div className="mt-2 space-y-2">
                                    <div>
                                      <Label htmlFor="markup" className="text-xs">Markup %</Label>
                                      <Input
                                        id="markup"
                                        type="number"
                                        value={editMarkup}
                                        onChange={(e) => setEditMarkup(Number(e.target.value))}
                                        className="h-7 text-xs"
                                        min="0"
                                        max="1000"
                                      />
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs px-2"
                                        onClick={handleSaveMarkup}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs px-2"
                                        onClick={handleCancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1 flex items-center justify-between">
                                    <div className="text-xs space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Net:</span>
                                        <span className="font-medium">€{item.netPrice.toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Markup:</span>
                                        <Badge variant="outline" className="text-xs h-4">
                                          {item.markup_pct}%
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Gross:</span>
                                        <span className="font-semibold text-green-600">€{item.grossPrice.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditMarkup(item.id, item.markup_pct)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit markup</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove item</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </ScrollArea>

            {/* Cart Summary & Actions */}
            {cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t space-y-4"
              >
                <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Total:</span>
                      <span className="font-medium">€{cartSummary.nettoTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Markup:</span>
                      <Badge variant="outline" className="h-5">
                        {cartSummary.avgMarkupPct.toFixed(1)}%
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Gross Total:</span>
                      <span className="text-green-600">€{cartSummary.bruttoTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleFinalizeCart} disabled={isLoading}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Save Quote
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      
      <SaveQuoteDialog
        open={isSaveQuoteDialogOpen}
        onOpenChange={setIsSaveQuoteDialogOpen}
        cartSummary={cartSummary}
        itemCount={cartItems.length}
        onSaveQuote={handleSaveQuote}
      />
    </motion.aside>
  );
} 