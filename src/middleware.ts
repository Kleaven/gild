import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exempt login, setup, and callback routes
    if (
      request.nextUrl.pathname.startsWith('/admin/login') ||
      request.nextUrl.pathname.startsWith('/admin/setup')
    ) {
      return supabaseResponse;
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check platform admin status using service role to bypass RLS,
    // or just use anon client since RLS allows admins to read their own platform_admin row.
    const { data: adminRow } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      // Not an admin
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if they have WebAuthn credentials
    const { count } = await supabase
      .from('webauthn_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminRow.id);

    if (count === 0) {
      // Force setup
      return NextResponse.redirect(new URL('/admin/setup', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
