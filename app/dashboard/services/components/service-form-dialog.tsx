'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ServiceFormValues, serviceSchema } from '@/app/lib/validation-schemas';
import { Service } from '@/app/lib/pricing';
import { Plus, Loader2, DollarSign, Wrench } from 'lucide-react';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormValues) => void;
  defaultValues?: Service;
  isSubmitting: boolean;
  title: string;
  onDelete?: () => void;
}

export function ServiceFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultValues,
  isSubmitting,
  title,
  onDelete
}: ServiceFormDialogProps) {
  const isEditing = !!defaultValues;
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues ? {
      id: defaultValues.id,
      name: defaultValues.name,
      price_net: defaultValues.price_net,
      description: defaultValues.description || '',
    } : {
      name: '',
      price_net: 0,
      description: '',
    },
  });

  const handleSubmit = (data: ServiceFormValues) => {
    onSubmit(data);
  };

  const showDeleteButton = isEditing && onDelete && defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update service details and pricing' : 'Add a new service with name and price'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Service Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Wrench className="h-3 w-3 mr-1" />
                  Service Details
                </Badge>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Photography, Decoration, DJ Service"
                        className="focus:border-orange-500 focus:ring-orange-500"
                        autoFocus={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Brief description of the service..."
                        className="focus:border-orange-500 focus:ring-orange-500 resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Pricing Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Pricing
                </Badge>
              </div>

              <FormField
                control={form.control}
                name="price_net"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (€) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field}
                          type="number" 
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="pl-10 focus:border-orange-500 focus:ring-orange-500"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-between items-center pt-4">
              {showDeleteButton ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <span>Delete</span>
                </Button>
              ) : (
                <div></div>
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
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Update Service' : 'Create Service'}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 