'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from './server';
import { parseAuthError } from './errors';
import type { AuthError, AuthResult, AuthSession, AuthenticatedUser } from './types';

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

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({ email: email.trim(), password });

  if (signUpError) {
    return { data: null, error: parseAuthError(signUpError) };
  }
  if (!user) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Sign-up failed — no user returned' } };
  }

  // Use service client for profile insert — bypasses RLS (profiles_insert
  // requires authenticated session but sign-up hasn't set cookies yet).
  const serviceClient = getSupabaseServiceClient();
  const { error: profileInsertError } = await serviceClient.from('profiles').insert({
    id: user.id,
    display_name: displayName.trim(),
    username: username.trim(),
  });

  if (profileInsertError) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Profile creation failed' } };
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

  return { data: { user, profile }, error: null };
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
