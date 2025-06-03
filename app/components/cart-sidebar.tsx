'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/app/providers/cart-provider';
import { generateCartPDF, CartItemForPDF, CartSummaryForPDF } from '@/app/lib/pdf-export';
import { Card, CardContent } from '@/components/ui/card';
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
  Download,
  Edit,
  ChevronRight,
  GripVertical,
  Minus,
  Plus
} from 'lucide-react';

export default function CartSidebar() {
  const { cart, cartItems, isLoading, cartSummary, updateItemQuantity, updateItemMarkup, removeItem } = useCart();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editMarkup, setEditMarkup] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cartWidth, setCartWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Resizing functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = cartWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, 350), 800);
      setCartWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cartWidth]);

  const handleEdit = (itemId: string, currentMarkup: number, currentQuantity: number) => {
    setEditingItemId(itemId);
    setEditMarkup(currentMarkup);
    setEditQuantity(currentQuantity);
  };

  const handleSaveEdit = async () => {
    if (editingItemId) {
      try {
        await updateItemMarkup(editingItemId, editMarkup);
        await updateItemQuantity(editingItemId, editQuantity);
        setEditingItemId(null);
        toast.success('Item updated successfully');
      } catch (error) {
        toast.error('Failed to update item');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditMarkup(0);
    setEditQuantity(1);
  };

  const handleExportPDF = () => {
    try {
      // Convert cart items to PDF format
      const pdfItems: CartItemForPDF[] = cartItems.map(item => ({
        id: item.id,
        name: item.details?.name || 'Unknown Item',
        description: item.details?.description,
        type: item.item_type as 'meal' | 'packet',
        quantity: item.quantity,
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
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
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
      ref={sidebarRef}
      initial={{ x: 100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? '60px' : `${cartWidth}px`
      }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 h-screen border-l bg-card/50 backdrop-blur-sm overflow-hidden relative"
      style={{ width: isCollapsed ? '60px' : `${cartWidth}px` }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="absolute left-0 top-0 w-2 h-full cursor-col-resize z-10 group hover:bg-primary/20 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <div className="flex flex-col h-full pl-2">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span>Shopping Cart</span>
                </h2>
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
                  <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-base font-semibold">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in cart</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <>
            {/* Cart Items - Scrollable area with space for external fixed summary */}
            <div className="flex-1 overflow-auto pb-32">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted/50 rounded-md"></div>
                    </div>
                  ))}
                </div>
              ) : cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center p-6"
                >
                  <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 mb-4">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground text-base">Cart is empty</h3>
                    <p className="text-sm text-muted-foreground">Add meals or packets to get started</p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-3 space-y-2">
                  <AnimatePresence>
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <div className="relative bg-gradient-to-r from-card to-card/80 rounded-lg border border-border/50 hover:border-orange-400 hover:shadow-md hover:shadow-orange-400/20 transition-all duration-200">
                          {editingItemId === item.id ? (
                            /* Edit Mode */
                            <div className="p-3 space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-md flex-shrink-0">
                                  {item.item_type === 'meal' ? (
                                    <Utensils className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Package className="h-5 w-5 text-purple-600" />
                                  )}
                                </div>
                                <h4 className="font-medium text-sm truncate">
                                  {item.details?.name || 'Unknown Item'}
                                </h4>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Markup % with +/- buttons */}
                                <div>
                                  <Label htmlFor="markup" className="text-xs mb-1 block">Markup %</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:border-orange-300"
                                      onClick={() => setEditMarkup(Math.max(0, editMarkup - 1))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      id="markup"
                                      type="number"
                                      value={editMarkup}
                                      onChange={(e) => setEditMarkup(Number(e.target.value))}
                                      className="h-7 text-xs text-center flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      min="0"
                                      max="1000"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:border-orange-300"
                                      onClick={() => setEditMarkup(Math.min(1000, editMarkup + 1))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <Separator className="my-2" />
                                
                                {/* Quantity with +/- buttons */}
                                <div>
                                  <Label htmlFor="quantity" className="text-xs mb-1 block">Quantity</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:border-orange-300"
                                      onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(Number(e.target.value))}
                                      className="h-7 text-xs text-center flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      min="1"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:border-orange-300"
                                      onClick={() => setEditQuantity(editQuantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-3 flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                  onClick={handleSaveEdit}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-3 flex-1 hover:bg-orange-50 hover:border-orange-300"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            <div className="p-3">
                              {/* Header with icon, name, and quantity */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-md flex-shrink-0">
                                  {item.item_type === 'meal' ? (
                                    <Utensils className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Package className="h-5 w-5 text-purple-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {item.details?.name || 'Unknown Item'}
                                  </h4>
                                </div>
                              </div>
                              
                              {/* Price info in compact grid */}
                              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                                <div className="text-center">
                                  <div className="text-muted-foreground">Qty</div>
                                  <Badge variant="secondary" className="text-xs h-5 px-1.5 font-semibold">
                                    {item.quantity}x
                                  </Badge>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground">Unit</div>
                                  <div className="font-medium">€{item.netPrice.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground">Markup</div>
                                  <div className="font-medium">{item.markup_pct}%</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground">Total</div>
                                  <div className="font-semibold text-green-600">
                                    €{(item.grossPrice * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 flex-1 text-xs hover:bg-orange-50 hover:border-orange-300"
                                  onClick={() => handleEdit(item.id, item.markup_pct, item.quantity)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 flex-1 text-xs text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
}

// Fixed Cart Summary Component - to be placed at bottom right of page
export function CartSummaryFixed() {
  const { cartItems, cartSummary, isLoading } = useCart();

  const handleExportPDF = () => {
    try {
      // Convert cart items to PDF format
      const pdfItems: CartItemForPDF[] = cartItems.map(item => ({
        id: item.id,
        name: item.details?.name || 'Unknown Item',
        description: item.details?.description,
        type: item.item_type as 'meal' | 'packet',
        quantity: item.quantity,
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
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
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

  if (cartItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-[9999] w-72"
    >
      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-50/95 to-blue-50/95 dark:from-green-950/90 dark:to-blue-950/90 border border-green-200/80 dark:border-green-800/80 p-4 backdrop-blur-md shadow-xl mb-3">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net Total:</span>
            <span className="font-medium">€{cartSummary.nettoTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg. Markup:</span>
            <Badge variant="outline" className="h-5 text-sm px-2 font-medium">
              {cartSummary.avgMarkupPct.toFixed(1)}%
            </Badge>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base">Gross Total:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              €{cartSummary.bruttoTotal.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100/40 to-transparent dark:from-green-900/40 rounded-full -translate-y-4 translate-x-4"></div>
      </div>

      {/* Export Button */}
      <Button 
        variant="outline" 
        className="w-full h-12 bg-gray-900 text-white border-green-400/50 hover:bg-green-600/20 hover:!border-orange-400 hover:shadow-orange-400/20 font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm" 
        onClick={handleExportPDF}
        disabled={isLoading}
      >
        <Download className="h-5 w-5 mr-2" />
        Export PDF Quote
      </Button>
    </motion.div>
  );
} 