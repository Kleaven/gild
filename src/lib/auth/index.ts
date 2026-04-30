export type {
  AuthUser,
  AuthSession,
  UserProfile,
  AuthenticatedUser,
  AuthErrorCode,
  AuthError,
  AuthResult,
} from './types';

export { parseAuthError } from './errors';

export { getSupabaseBrowserClient } from './client';

export { getSupabaseServerClient, getSupabaseServiceClient } from './server';

export { getSession, getAuthenticatedUser, requireAuth } from './session';

export { signUp, signIn, signOut, refreshSession } from './actions';

export { signInWithGoogle } from './oauth';

export {
  getWebAuthnConfig,
  generateAdminRegistrationOptions,
  verifyAdminRegistration,
  generateAdminAuthenticationOptions,
  verifyAdminAuthentication,
} from './webauthn/index';
