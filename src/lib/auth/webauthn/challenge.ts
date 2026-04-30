// server-only — do not import from client components
import { Redis } from '@upstash/redis';
import { env } from '../../env';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const CHALLENGE_TTL_SECONDS = 300; // 5 minutes

function key(adminId: string): string {
  return `webauthn:challenge:${adminId}`;
}

export async function storeChallenge(adminId: string, challenge: string): Promise<void> {
  await redis.set(key(adminId), challenge, { ex: CHALLENGE_TTL_SECONDS });
}

export async function getChallenge(adminId: string): Promise<string | null> {
  return redis.get<string>(key(adminId));
}

export async function deleteChallenge(adminId: string): Promise<void> {
  await redis.del(key(adminId));
}
