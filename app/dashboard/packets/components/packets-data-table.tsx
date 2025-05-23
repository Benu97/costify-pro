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
import { Pencil, Trash2 } from 'lucide-react';
import { CrudToolbar } from '@/app/components/CrudToolbar';
import { Packet } from '@/app/lib/pricing';
import { PacketFormValues, createPacket, deletePacket, updatePacket } from '@/app/actions/packets';
import { PacketFormDialog } from './packet-form-dialog';
import { ConfirmDeleteDialog } from '@/app/dashboard/ingredients/components/confirm-delete-dialog';
import { useRouter } from 'next/navigation';

interface PacketsDataTableProps {
  initialPackets: Packet[];
}

export default function PacketsDataTable({ initialPackets }: PacketsDataTableProps) {
  const router = useRouter();
  const [packets, setPackets] = useState<Packet[]>(initialPackets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<Packet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleEdit = (packet: Packet) => {
    setCurrentPacket(packet);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (packet: Packet) => {
    setCurrentPacket(packet);
    setIsDeleteDialogOpen(true);
  };

  const handleCreatePacket = async (data: PacketFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createPacket(data);
      if (result.success && result.data) {
        setPackets([...packets, result.data as Packet]);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create packet:', error);
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
            item.id === data.id ? result.data as Packet : item
          )
        );
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update packet:', error);
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
      }
    } catch (error) {
      console.error('Failed to delete packet:', error);
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
              <TableHead className="text-right">Price Override (€)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
                    {packet.price_net_override 
                      ? parseFloat(packet.price_net_override.toString()).toFixed(2) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(packet)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(packet)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeletePacket}
            isSubmitting={isSubmitting}
            itemName={currentPacket.name}
            itemType="packet"
          />
        </>
      )}
    </div>
  );
}
