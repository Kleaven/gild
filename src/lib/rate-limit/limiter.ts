// server-only — do not import from client components
import { redis } from './client';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix timestamp ms when the window resets
};

export async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `ratelimit:${action}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zadd(key, { nx: true }, { score: now, member: String(now) });
  pipeline.zcard(key);
  pipeline.expire(key, windowSeconds);

  const results = await pipeline.exec();
  const count = results[2] as number;

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const resetAt = now + windowSeconds * 1000;

  return { allowed, remaining, resetAt };
}
