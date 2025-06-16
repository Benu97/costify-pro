'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pencil, Trash2, MoreHorizontal, Eye, Copy, ShoppingCart } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { PacketWithMeals } from '@/app/lib/pricing';
import { PacketFormValues } from '@/app/lib/validation-schemas';
import { createPacket, deletePacket, updatePacket } from '@/app/actions/packets';
import { PacketFormDialog } from './packet-form-dialog';
import { PacketDetailsDialog } from './packet-details-dialog';
import { AddToCartDialog } from './add-to-cart-dialog';
import { ConfirmDeleteDialog } from '@/app/dashboard/ingredients/components/confirm-delete-dialog';
import { FavoriteButton } from '@/app/components/favorite-button';
import { calculatePacketPrice, formatPrice } from '@/app/lib/price-utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from '@/app/providers/language-provider';

interface PacketsDataTableProps {
  initialPackets: PacketWithMeals[];
}

export default function PacketsDataTable({ initialPackets }: PacketsDataTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [packets, setPackets] = useState<PacketWithMeals[]>(initialPackets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<PacketWithMeals | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleEdit = (packet: PacketWithMeals) => {
    setCurrentPacket(packet);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (packet: PacketWithMeals) => {
    setCurrentPacket(packet);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (packet: PacketWithMeals) => {
    setCurrentPacket(packet);
    setIsDetailsDialogOpen(true);
  };

  const handleAddToCart = (packet: PacketWithMeals) => {
    setCurrentPacket(packet);
    setIsCartDialogOpen(true);
  };

  const handleCartSubmit = async (packet: PacketWithMeals, quantity: number, markupPercentage: number) => {
    // TODO: Implement actual cart functionality
    console.log('Adding to cart:', { packet: packet.name, quantity, markupPercentage });
    // This should integrate with your cart context/state management
  };

  const handleDuplicate = async (packet: PacketWithMeals) => {
    const duplicateData: PacketFormValues = {
      name: `${packet.name} (Copy)`,
      description: packet.description,
      price_net_override: packet.price_net_override,
    };
    
    setIsSubmitting(true);
    try {
      const result = await createPacket(duplicateData);
      if (result.success && result.data) {
        // Convert the basic Packet to PacketWithMeals with empty meals
        const newPacketWithMeals: PacketWithMeals = {
          ...(result.data as any),
          meals: []
        };
        setPackets([...packets, newPacketWithMeals]);
        toast.success(t('messages.packetDuplicatedSuccessfully'), {
          description: t('messages.packetCreatedDescription', { name: duplicateData.name })
        });
      }
    } catch (error) {
      console.error('Failed to duplicate packet:', error);
      toast.error(t('messages.failedToDuplicatePacket'), {
        description: t('messages.pleaseRetry')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePacket = async (data: PacketFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createPacket(data);
      if (result.success && result.data) {
        // Convert the basic Packet to PacketWithMeals with empty meals
        const newPacketWithMeals: PacketWithMeals = {
          ...(result.data as any),
          meals: []
        };
        setPackets([...packets, newPacketWithMeals]);
        setIsAddDialogOpen(false);
        toast.success(t('messages.packetCreatedSuccessfully'), {
          description: t('messages.packetCreatedDescription', { name: data.name })
        });
      }
    } catch (error) {
      console.error('Failed to create packet:', error);
      toast.error(t('messages.failedToCreatePacket'), {
        description: t('messages.pleaseRetry')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePacket = async (data: PacketFormValues) => {
    if (!data.id) return;
    
    setIsSubmitting(true);
    try {
      const result = await updatePacket(data);
      if (result.success && result.data) {
        setPackets(
          packets.map((item) => 
            item.id === data.id ? { ...(result.data as any), meals: item.meals } : item
          )
        );
        setIsEditDialogOpen(false);
        toast.success(t('messages.packetUpdatedSuccessfully'), {
          description: t('messages.packetUpdatedDescription', { name: data.name })
        });
      }
    } catch (error) {
      console.error('Failed to update packet:', error);
      toast.error(t('messages.failedToUpdatePacket'), {
        description: t('messages.pleaseRetry')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePacket = async () => {
    if (!currentPacket) return;
    
    setIsSubmitting(true);
    try {
      const result = await deletePacket(currentPacket.id);
      if (result.success) {
        setPackets(
          packets.filter((item) => item.id !== currentPacket.id)
        );
        setIsDeleteDialogOpen(false);
        toast.success(t('messages.packetDeletedSuccessfully'), {
          description: t('messages.packetDeletedDescription', { name: currentPacket.name })
        });
      }
    } catch (error) {
      console.error('Failed to delete packet:', error);
      toast.error(t('messages.failedToDeletePacket'), {
        description: t('messages.pleaseRetry')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <CrudToolbar 
        title="Packets" 
        onAddNew={handleAddNew} 
        onRefresh={handleRefresh} 
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Base Price (€)</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No packets found. Create your first packet!
                </TableCell>
              </TableRow>
            ) : (
              packets.map((packet) => (
                <TableRow key={packet.id}>
                  <TableCell>{packet.name}</TableCell>
                  <TableCell>{packet.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(calculatePacketPrice(packet, packet.meals))}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <FavoriteButton
                        id={packet.id}
                        type="packet"
                        name={packet.name}
                        size="icon"
                        className="h-8 w-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(packet)}
                        className="h-8"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(packet)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('ui.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(packet)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit packet
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(packet)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate packet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(packet)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete packet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PacketFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreatePacket}
        isSubmitting={isSubmitting}
        title="Add New Packet"
      />

      {currentPacket && (
        <>
          <PacketFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            defaultValues={currentPacket}
            onSubmit={handleUpdatePacket}
            isSubmitting={isSubmitting}
            title="Edit Packet"
          />

          <PacketDetailsDialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            packetId={currentPacket.id}
            onPacketUpdated={(updatedPacket) => {
              // Convert the basic Packet to PacketWithMeals by preserving existing meals
              const updatedPacketWithMeals: PacketWithMeals = {
                ...(updatedPacket as any),
                meals: packets.find(p => p.id === updatedPacket.id)?.meals || []
              };
              setPackets(packets.map(p => p.id === updatedPacket.id ? updatedPacketWithMeals : p));
            }}
          />

          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeletePacket}
            isSubmitting={isSubmitting}
            itemName={currentPacket.name}
            itemType="packet"
          />

          <AddToCartDialog
            open={isCartDialogOpen}
            onOpenChange={setIsCartDialogOpen}
            packet={currentPacket}
            onAddToCart={handleCartSubmit}
          />
        </>
      )}
    </div>
  );
}
