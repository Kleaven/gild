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

    // display_name CHECK: char_length BETWEEN 2 AND 50. Pad if the derived
    // name is shorter than 2 (e.g. single-char email prefix like a@gmail.com).
    const rawDisplayName = deriveDisplayName(meta, emailPrefix);
    const displayName =
      rawDisplayName.length >= 2 ? rawDisplayName.slice(0, 50) : rawDisplayName.padEnd(2, '_');

    const serviceClient = getSupabaseServiceClient();
    // username is intentionally omitted: derived usernames from email prefixes
    // often contain '.' or '-' which violate the CHECK constraint
    // (^[a-zA-Z0-9_]{3,30}$). Leaving it NULL lets the user set it later.
    // A missing username never blocks core flows; a missing profile does.
    const { error: profileError } = await serviceClient.from('profiles').insert({
      id: user.id,
      display_name: displayName,
    });

    if (profileError) {
      // Profile is required for community creation and other core flows.
      // Redirect to sign-in with an error rather than leaving the user
      // in a profileless state that produces cryptic 409s downstream.
      return NextResponse.redirect(
        new URL('/sign-in?error=profile_setup_failed', request.url),
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
