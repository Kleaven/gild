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

  // ── Custom domains (Pro) ──────────────────────────────────────────────────
  // If the request arrives on a creator's own domain, transparently rewrite it
  // to that community's subtree. Anonymous viewing is allowed here (public-
  // facing brand site); per-page gating still applies for private communities.
  const host = ((request.headers.get('host') ?? '').split(':')[0] ?? '').toLowerCase();
  let primaryHost = '';
  try { primaryHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? '').hostname.toLowerCase(); } catch { /* noop */ }
  const isPlatformHost =
    !host ||
    host === primaryHost ||
    host === 'localhost' ||
    host.endsWith('.vercel.app');

  if (!isPlatformHost) {
    const { data: slug } = await supabase.rpc('resolve_custom_domain', { p_domain: host });
    if (typeof slug === 'string' && slug.length > 0) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/c/${slug}${pathname === '/' ? '' : pathname}`;
      const rewritten = NextResponse.rewrite(rewriteUrl, { request });
      supabaseResponse.cookies.getAll().forEach((c) => rewritten.cookies.set(c));
      return rewritten;
    }
    // Unknown domain pointing at us — let it fall through to a normal 404.
  }

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
    // Excludes Next.js internals, static assets, API routes, and the
    // Sentry ingest tunnel at /monitoring/* (registered by withSentryConfig
    // — must not be intercepted by auth-aware middleware or it 404s).
    '/((?!_next/static|_next/image|favicon.ico|api/|monitoring/).*)',
  ],
};
