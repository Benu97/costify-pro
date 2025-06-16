'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../lib/supabase-server';
import { supabaseAdmin, withAuth } from '../lib/supabase-server-utils';
import { serviceSchema, type ServiceFormValues } from '../lib/validation-schemas';

// Get all services for the current user
export async function getServices() {
  const supabase = createServerClient();
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching services:', error.message);
    throw new Error('Failed to fetch services');
  }

  return services;
}

// Create a new service
export const createService = withAuth(async (formData: ServiceFormValues) => {
  const validated = serviceSchema.parse(formData);
  
  // Get authenticated user (withAuth ensures user exists)
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({
      name: validated.name,
      price_net: validated.price_net,
      description: validated.description,
      owner_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error.message);
    throw new Error(`Failed to create service: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Update an existing service
export const updateService = withAuth(async (formData: ServiceFormValues) => {
  if (!formData.id) {
    throw new Error('Service ID is required for updates');
  }

  const validated = serviceSchema.parse(formData);
  
  const { data, error } = await supabaseAdmin
    .from('services')
    .update({
      name: validated.name,
      price_net: validated.price_net,
      description: validated.description,
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error.message);
    throw new Error(`Failed to update service: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true, data };
});

// Delete a service
export const deleteService = withAuth(async (id: string) => {
  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting service:', error.message);
    throw new Error(`Failed to delete service: ${error.message}`);
  }

  revalidatePath('/');
  return { success: true };
}); 