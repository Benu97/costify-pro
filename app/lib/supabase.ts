import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file');
}

// Server-side Supabase client (for server components)
export const createServerClient = () => {
  const cookieStore = cookies();
  return createClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};

// Browser-side Supabase client (for client components)
export const createBrowserClient = () => createClientComponentClient<Database>(); 