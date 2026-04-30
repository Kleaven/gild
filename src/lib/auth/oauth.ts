'use server';

import { getSupabaseServerClient } from './server';
import { parseAuthError } from './errors';
import { env } from '../env';
import type { AuthError } from './types';

export async function signInWithGoogle(): Promise<{ url: string | null; error: AuthError | null }> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { url: null, error: parseAuthError(error) };
  }

  // signInWithOAuth returns a URL — the caller (client component) is
  // responsible for navigating to it via window.location.href. Do not
  // call redirect() here; that would skip the OAuth provider redirect.
  return { url: data.url, error: null };
}
