import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = [
    '/profile',
    '/bookings',
    '/messages',
    '/settings',
    '/favorites',
  ];

  // Provider-only routes
  const providerRoutes = ['/provider/dashboard', '/provider/services'];

  const isProtectedRoute = protectedRoutes.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );
  const isProviderRoute = providerRoutes.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Auth routes that should redirect to home if user is already logged in
  const authRoutes = ['/auth/login', '/auth/register'];
  const isAuthRoute = authRoutes.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect if accessing auth routes while logged in
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect if accessing protected routes while not logged in
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Redirect if accessing provider routes while not logged in as a provider
  if (isProviderRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const isProvider = session.user.user_metadata.role === 'provider';
    if (!isProvider) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/bookings/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/favorites/:path*',
    '/provider/:path*',
    '/auth/:path*',
  ],
};