import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If accessing a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for JWT access token cookie (set by frontend after login)
  const accessToken = request.cookies.get('access_token');
  
  // Fallback: check for refresh_token cookie (httpOnly cookie set by backend)
  const refreshToken = request.cookies.get('refresh_token');

  // If no JWT access token and no refresh token, redirect to login
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination for redirect after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User has either access token or refresh token, allow access
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

