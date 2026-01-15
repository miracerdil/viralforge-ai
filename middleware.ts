import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, isValidLocale } from '@/lib/i18n/config';

// Admin email allowlist check (server-side)
function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.SUPERADMIN_EMAILS || '';
  const allowlist = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Handle root path - redirect to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Extract locale from pathname
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  // If no valid locale in path, redirect to default locale
  if (!isValidLocale(potentialLocale)) {
    const newPathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }

  const locale = potentialLocale || defaultLocale;

  // Create Supabase client for auth check
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if accessing admin routes
  const isAdminPath = pathname.includes('/admin');

  if (isAdminPath) {
    // Admin routes require authentication
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Admin routes require superadmin email
    if (!isSuperAdmin(user.email)) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    return response;
  }

  // Protected routes check (excluding admin which is handled above)
  const protectedPaths = ['/dashboard', '/analysis', '/abtest'];
  const isProtectedPath = protectedPaths.some((path) => pathname.includes(path));

  // Check for disabled page - allow access even if disabled
  const isDisabledPage = pathname.includes('/disabled');

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Check if user account is disabled (for protected routes only)
  if (isProtectedPath && user && !isDisabledPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_disabled')
      .eq('id', user.id)
      .single();

    if (profile?.is_disabled) {
      return NextResponse.redirect(new URL(`/${locale}/disabled`, request.url));
    }
  }

  // Auth pages - redirect to dashboard if already logged in
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((path) => pathname.includes(path));

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
