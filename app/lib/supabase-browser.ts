'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';

// Browser-side Supabase client (for client components)
export const createBrowserClient = () => 
  createClientComponentClient<Database>(); 