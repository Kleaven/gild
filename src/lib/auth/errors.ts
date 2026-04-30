import type { AuthError, AuthErrorCode } from './types';

function classify(message: string): AuthErrorCode {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'INVALID_CREDENTIALS';
  }
  if (m.includes('email not confirmed')) {
    return 'EMAIL_NOT_CONFIRMED';
  }
  if (m.includes('jwt expired') || m.includes('session expired')) {
    return 'SESSION_EXPIRED';
  }
  if (m.includes('rate limit')) {
    return 'RATE_LIMITED';
  }
  return 'UNKNOWN';
}

export function parseAuthError(err: unknown): AuthError {
  if (err instanceof Error) {
    return { code: classify(err.message), message: err.message };
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  ) {
    const message = (err as { message: string }).message;
    return { code: classify(message), message };
  }
  return { code: 'UNKNOWN', message: String(err) };
}
