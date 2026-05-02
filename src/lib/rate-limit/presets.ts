// server-only — do not import from client components
import { checkRateLimit, type RateLimitResult } from './limiter';

async function signIn(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'sign_in', 10, 60);
}

async function signUp(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'sign_up', 5, 3600);
}

async function passwordReset(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'password_reset', 3, 3600);
}

async function postCreate(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, 'post_create', 20, 60);
}

async function commentCreate(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, 'comment_create', 30, 60);
}

async function apiGeneral(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'api_general', 100, 60);
}

export const rateLimit = { signIn, signUp, passwordReset, postCreate, commentCreate, apiGeneral };
