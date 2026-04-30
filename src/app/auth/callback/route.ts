import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';

function sanitizeNext(next: string | null): string {
  // Prevent open redirect: only allow paths that start with '/'.
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/';
}

function deriveDisplayName(meta: Record<string, unknown>, emailPrefix: string): string {
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
    return meta.full_name.trim();
  }
  if (typeof meta.name === 'string' && meta.name.trim()) {
    return meta.name.trim();
  }
  return emailPrefix;
}

function deriveUsername(meta: Record<string, unknown>, emailPrefix: string): string {
  if (typeof meta.preferred_username === 'string' && meta.preferred_username.trim()) {
    return meta.preferred_username.trim().toLowerCase().replace(/\s+/g, '_');
  }
  return emailPrefix.toLowerCase().replace(/\s+/g, '_');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=no_code', request.url));
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url));
  }

  const { user } = data.session;

  // Ensure a profile row exists — first-time OAuth sign-up will not have one.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    const email: string = user.email ?? '';
    const emailPrefix = email.split('@')[0] ?? 'user';
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

    const serviceClient = getSupabaseServiceClient();
    await serviceClient.from('profiles').insert({
      id: user.id,
      display_name: deriveDisplayName(meta, emailPrefix),
      username: deriveUsername(meta, emailPrefix),
    });
    // Profile insert errors are non-fatal here — the session is valid.
    // A missing profile will surface at the next getAuthenticatedUser() call.
  }

  return NextResponse.redirect(new URL(next, request.url));
}
