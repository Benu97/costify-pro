import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/app/lib/database.types';

// Handle email confirmation redirects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  
  if (token_hash && type) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const redirectTo = request.nextUrl.searchParams.get('next') ?? '/';
    
    // Exchange the token for a session
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    
    if (error) {
      // Redirect to login page with error
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
    
    // Successfully verified email, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If no token or type, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
} 