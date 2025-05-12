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

  // Check auth status for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  // If accessing a protected route without being authenticated
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If accessing login page while authenticated
  if (isLoginPage && user) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return response;
}

// Add the paths that should be checked by the middleware
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}; 