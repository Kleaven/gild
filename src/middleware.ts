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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session on every request — MUST use getUser() not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (
      pathname.startsWith('/admin/login') ||
      pathname.startsWith('/admin/setup')
    ) {
      return supabaseResponse;
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: adminRow } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { count } = await supabase
      .from('webauthn_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminRow.id);

    if (count === 0) {
      return NextResponse.redirect(new URL('/admin/setup', request.url));
    }

    return supabaseResponse;
  }

  // ── Auth pages: redirect authenticated users away ────────────────────────
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  // ── Protected routes: require session ────────────────────────────────────
  const isProtected =
    pathname.startsWith('/c/') || pathname.startsWith('/onboarding/');
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
