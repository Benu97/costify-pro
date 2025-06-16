import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './app/lib/database.types';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res: response });
  
  // Refresh session if expired
  await supabase.auth.getSession();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check auth status for routes
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  // If accessing login page while authenticated, redirect to home
  if (isLoginPage && user) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If unauthenticated, only allow access to login page
  if (!user && !isLoginPage) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 