import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export type AuthUser = User;
export type AuthSession = Session;
export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export type AuthenticatedUser = {
  user: AuthUser;
  profile: UserProfile;
  // True when sign-up created the account but Supabase has NOT issued a
  // session because email confirmation is pending. The caller must show a
  // "check your inbox" notice instead of redirecting into the app. Always
  // false/undefined for sign-in (a session is guaranteed there).
  needsEmailConfirmation?: boolean;
};

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'SESSION_EXPIRED'
  | 'USER_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };
