'use client';

import { useState } from 'react';
import { useCart } from '@/app/providers/cart-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, Trash2, X } from 'lucide-react';

export default function CartTable() {
  const { cartItems, updateItem, removeItem } = useCart();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMarkup, setEditMarkup] = useState<number>(0);

  const handleEdit = (itemId: string, currentMarkup: number) => {
    setEditingId(itemId);
    setEditMarkup(currentMarkup);
  };

  const handleSave = async (itemId: string) => {
    await updateItem(itemId, editMarkup);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleRemove = async (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      await removeItem(itemId);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Netto (€)</TableHead>
            <TableHead className="text-right">Markup %</TableHead>
            <TableHead className="text-right">Brutto (€)</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cartItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Your cart is empty. Add items using the search above.
              </TableCell>
            </TableRow>
          ) : (
            cartItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.details?.name}</TableCell>
                <TableCell className="capitalize">{item.item_type}</TableCell>
                <TableCell className="text-right">
                  {item.netPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editMarkup}
                      onChange={(e) => setEditMarkup(parseFloat(e.target.value))}
                      className="w-20 inline-block"
                    />
                  ) : (
                    item.markup_pct
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.grossPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-1">
                    {editingId === item.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(item.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item.id, item.markup_pct)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
