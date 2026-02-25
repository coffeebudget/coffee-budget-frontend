import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, home page, and legal pages
  if (pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If no session, redirect to homepage
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static files, api routes and _next internal routes
    '/((?!_next/static|_next/image|favicon.ico|api|.*).*)',
  ],
}; 