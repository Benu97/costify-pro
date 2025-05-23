'use client';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file');
}

// Browser-side Supabase client (for client components)
export const createBrowserSupabaseClient = () => 
  createClientComponentClient<Database>();

// Server-side Supabase client with auth (for server components)
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

// Admin client with service role for bypassing RLS
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Higher-order function to wrap server actions with admin privileges
 * This bypasses RLS by using the service role key
 * 
 * @example
 * // Define a server action
 * async function myAction(args) {
 *   // Access data with RLS bypassed
 *   const { data } = await supabaseAdmin.from('my_table').select('*');
 *   return data;
 * }
 * 
 * // Export the wrapped action
 * export const myProtectedAction = withAuth(myAction);
 */
export function withAuth<T extends (...args: any[]) => Promise<any>>(
  action: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      // Verify user is authenticated with the server client
      const supabase = createServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Unauthorized: User not authenticated');
      }
      
      // Call the action with admin privileges
      return await action(...args);
    } catch (error) {
      console.error('Auth error in server action:', error);
      throw error;
    }
  };
}
