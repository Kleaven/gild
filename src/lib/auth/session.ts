// server-only — do not import from client components
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from './server';
import { parseAuthError } from './errors';
import type { AuthResult, AuthSession, AuthenticatedUser } from './types';

export async function getSession(): Promise<AuthResult<AuthSession>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { data: null, error: parseAuthError(error) };
  }
  if (!session) {
    return { data: null, error: { code: 'SESSION_EXPIRED', message: 'No active session' } };
  }
  return { data: session, error: null };
}

export async function getAuthenticatedUser(): Promise<AuthResult<AuthenticatedUser>> {
  const supabase = await getSupabaseServerClient();

  // getUser() validates the JWT server-side — safer than getSession().user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: parseAuthError(userError) };
  }
  if (!user) {
    return { data: null, error: { code: 'SESSION_EXPIRED', message: 'No active session' } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      data: null,
      error: {
        code: 'PROFILE_NOT_FOUND',
        message: profileError?.message ?? 'Profile not found',
      },
    };
  }

  return { data: { user, profile }, error: null };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const result = await getAuthenticatedUser();
  if (result.error) {
    redirect('/sign-in');
  }
  return result.data;
}
