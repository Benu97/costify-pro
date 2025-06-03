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
  Plus,
  Minus,
  Edit,
  ChevronRight,
  GripVertical
} from 'lucide-react';

export default function CartSidebar() {
  const { cart, cartItems, isLoading, cartSummary, updateItemQuantity, updateItemMarkup, removeItem } = useCart();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editMarkup, setEditMarkup] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cartWidth, setCartWidth] = useState(400);
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
      const newWidth = Math.min(Math.max(startWidth + deltaX, 300), 800);
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

  const handleEditMarkup = (itemId: string, currentMarkup: number) => {
    setEditingItemId(itemId);
    setEditMarkup(currentMarkup);
  };

  const handleSaveMarkup = async () => {
    if (editingItemId) {
      try {
        await updateItemMarkup(editingItemId, editMarkup);
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

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      try {
        await updateItemQuantity(itemId, newQuantity);
        toast.success('Quantity updated');
      } catch (error) {
        toast.error('Failed to update quantity');
      }
    }
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
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Shopping Cart</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
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
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in cart</p>
              </TooltipContent>
            </Tooltip>
            
            {cartItems.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-8 p-0"
                    onClick={handleExportPDF}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Export PDF (€{cartSummary.bruttoTotal.toFixed(2)})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 p-4" style={{ width: `${cartWidth - 8}px` }}>
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
                        <Card className="p-3 transition-all hover:shadow-md" style={{ width: '100%' }}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
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
                                
                                {/* Quantity Controls */}
                                <div className="mt-2 flex items-center space-x-2">
                                  <Label className="text-xs">Qty:</Label>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium min-w-[20px] text-center">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
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
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <div className="text-xs space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Unit:</span>
                                        <span className="font-medium">€{item.netPrice.toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Markup:</span>
                                        <Badge variant="outline" className="text-xs h-4">
                                          {item.markup_pct}%
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">Total:</span>
                                        <span className="font-semibold text-green-600">
                                          €{(item.grossPrice * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
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
                style={{ width: `${cartWidth - 8}px` }}
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
                  <Button 
                    variant="default" 
                    className="w-full" 
                    onClick={handleExportPDF}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF Quote
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.aside>
  );
} 