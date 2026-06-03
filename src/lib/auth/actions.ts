'use server';

import { headers } from 'next/headers';
import { getSupabaseServerClient, getSupabaseServiceClient } from './server';
import { parseAuthError } from './errors';
import { rateLimit } from '../rate-limit';
import type { AuthError, AuthResult, AuthSession, AuthenticatedUser } from './types';

// Extract caller IP for IP-scoped rate-limit buckets. Vercel populates
// x-forwarded-for; we take the first hop. Falls back to a constant for
// localhost development so we never accidentally let unbounded calls
// through just because the header is missing.
async function getCallerIp(): Promise<string> {
  const hdrs = await headers();
  const fwd = hdrs.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return hdrs.get('x-real-ip')?.trim() ?? 'unknown';
}

export async function signUp(formData: FormData): Promise<AuthResult<AuthenticatedUser>> {
  const email = formData.get('email');
  const password = formData.get('password');
  const displayName = formData.get('displayName');
  const username = formData.get('username');

  if (typeof email !== 'string' || !email.trim()) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Email is required' } };
  }
  if (typeof password !== 'string' || password.length < 8) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Password must be at least 8 characters' } };
  }
  if (typeof displayName !== 'string' || !displayName.trim()) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Display name is required' } };
  }
  if (typeof username !== 'string' || !username.trim()) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Username is required' } };
  }

  // IP-scoped sign-up cap: 5 per hour. Defence in depth on top of any
  // Supabase Auth rate limit — necessary because email confirmation is
  // off in dev/staging, so each signup creates a usable account.
  const ip = await getCallerIp();
  const rl = await rateLimit.signUp(ip);
  if (!rl.allowed) {
    return {
      data: null,
      error: { code: 'UNKNOWN', message: 'Too many sign-up attempts. Try again later.' },
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user, session },
    error: signUpError,
  } = await supabase.auth.signUp({ email: email.trim(), password });

  if (signUpError) {
    return { data: null, error: parseAuthError(signUpError) };
  }
  if (!user) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Sign-up failed — no user returned' } };
  }

  // When email confirmation is enabled, Supabase returns a user but NO
  // session — the account is dormant until the link is clicked. The client
  // uses this flag to show a "check your inbox" notice rather than pushing
  // the visitor into /onboarding (which would bounce them back to /sign-in).
  const needsEmailConfirmation = session === null;

  // Use service client for the profile row — bypasses RLS (profiles_insert
  // requires an authenticated session but sign-up hasn't set cookies yet).
  // UPSERT (not insert): if a DB trigger already created a stub profile row for
  // the new auth user, we update it with the chosen name instead of colliding
  // on the primary key. onConflict 'id' = the profiles PK.
  const serviceClient = getSupabaseServiceClient();
  const { error: profileInsertError } = await serviceClient
    .from('profiles')
    .upsert(
      {
        id: user.id,
        display_name: displayName.trim(),
        username: username.trim(),
      },
      { onConflict: 'id' },
    );

  if (profileInsertError) {
    // Surface the real reason — a generic message hid the actual failure.
    return {
      data: null,
      error: { code: 'UNKNOWN', message: `Profile creation failed: ${profileInsertError.message}` },
    };
  }

  const { data: profile, error: profileFetchError } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileFetchError || !profile) {
    return {
      data: null,
      error: { code: 'PROFILE_NOT_FOUND', message: 'Profile fetch failed after creation' },
    };
  }

  return { data: { user, profile, needsEmailConfirmation }, error: null };
}

export async function signIn(formData: FormData): Promise<AuthResult<AuthenticatedUser>> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email.trim()) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Email is required' } };
  }
  if (typeof password !== 'string' || !password) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Password is required' } };
  }

  // IP-scoped sign-in cap: 10 per minute. Slows credential-stuffing
  // attacks across multiple accounts from the same source.
  const ip = await getCallerIp();
  const rl = await rateLimit.signIn(ip);
  if (!rl.allowed) {
    return {
      data: null,
      error: { code: 'UNKNOWN', message: 'Too many sign-in attempts. Try again later.' },
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (signInError) {
    return { data: null, error: parseAuthError(signInError) };
  }
  if (!user) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Sign-in failed — no user returned' } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      data: null,
      error: { code: 'PROFILE_NOT_FOUND', message: profileError?.message ?? 'Profile not found' },
    };
  }

  return { data: { user, profile }, error: null };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: parseAuthError(error) };
  }
  return { error: null };
}

export async function refreshSession(): Promise<AuthResult<AuthSession>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();

  if (error) {
    return {
      data: null,
      error: { code: 'SESSION_EXPIRED', message: error.message },
    };
  }
  if (!session) {
    return {
      data: null,
      error: { code: 'SESSION_EXPIRED', message: 'Session could not be refreshed' },
    };
  }
  return { data: session, error: null };
}
