'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { PacketFormValues, packetSchema } from '@/app/lib/validation-schemas';
import { Packet } from '@/app/lib/pricing';

interface PacketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PacketFormValues) => void;
  defaultValues?: Packet;
  isSubmitting: boolean;
  title: string;
  onDelete?: () => void;
}

export function PacketFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting,
  title,
  onDelete
}: PacketFormDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<PacketFormValues>({
    resolver: zodResolver(packetSchema) as any,
    defaultValues: defaultValues ?? {
      name: '',
      description: '',
      price_net_override: null,
    },
  });

  const handleSubmit = (data: PacketFormValues) => {
    // If editing, ensure we pass the ID
    if (defaultValues) {
      data.id = defaultValues.id;
    }
    onSubmit(data);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
  };

  // Show delete confirmation dialog
  if (showDeleteConfirm && defaultValues) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Packet
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to delete the packet &quot;{defaultValues.name}&quot;? 
              <br />
              <strong className="text-destructive">This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 my-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>This packet and all its meal configurations will be removed.</span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Always show the name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Wedding Package" 
                      {...field} 
                      autoFocus={!defaultValues} // Auto-focus for add dialog
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Only show additional fields when editing (defaultValues provided) */}
            {defaultValues && (
              <>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Complete wedding catering package including appetizers, main course, and dessert" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_net_override"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Override (€) - Optional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty to calculate from meals"
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? null : parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {!defaultValues && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                💡 <strong>Tip:</strong> After creating your packet, use the &quot;Edit&quot; button to add meals and set custom prices.
              </div>
            )}
            <DialogFooter className="flex justify-between">
              {/* Show delete button only when editing and onDelete is provided */}
              {defaultValues && onDelete ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Packet
                </Button>
              ) : (
                <div /> // Spacer for layout
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
