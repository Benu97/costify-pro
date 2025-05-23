'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase-server-utils';
import { packetSchema, type PacketFormValues } from '../lib/validation-schemas';

// Get all packets for the current user
export async function getPackets() {
  const supabase = createServerClient();
  const { data: packets, error } = await supabase
    .from('packets')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching packets:', error.message);
    throw new Error('Failed to fetch packets');
  }

  return packets;
}

// Create a new packet
export const createPacket = withAuth(async (formData: PacketFormValues) => {
  const validated = packetSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('packets')
    .insert({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
      owner_id: (await createServerClient().auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating packet:', error.message);
    throw new Error(`Failed to create packet: ${error.message}`);
  }

  revalidatePath('/dashboard/packets');
  return { success: true, data };
});

// Update an existing packet
export const updatePacket = withAuth(async (formData: PacketFormValues) => {
  if (!formData.id) {
    throw new Error('Packet ID is required for updates');
  }

  const validated = packetSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('packets')
    .update({
      name: validated.name,
      description: validated.description,
      price_net_override: validated.price_net_override,
    })
    .eq('id', validated.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating packet:', error.message);
    throw new Error(`Failed to update packet: ${error.message}`);
  }

  revalidatePath('/dashboard/packets');
  return { success: true, data };
});

// Delete a packet
export const deletePacket = withAuth(async (id: string) => {
  const { error } = await supabaseAdmin
    .from('packets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting packet:', error.message);
    throw new Error(`Failed to delete packet: ${error.message}`);
  }

  revalidatePath('/dashboard/packets');
  return { success: true };
});
