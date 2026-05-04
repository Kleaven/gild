// Schema grows with the build — see CLAUDE.md migration sequence.
// Add Stripe vars at Step 27, Cloudflare at Step 46, Resend at Step 50.
// Upstash vars added at Step 20 (WebAuthn challenge store) — reused at Step 33.

import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_HOBBY_PRICE_ID: z.string().min(1),
  STRIPE_PRO_PRICE_ID: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
type Env = ServerEnv & ClientEnv;

const SERVER_KEYS = new Set<string>([
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_HOBBY_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'NODE_ENV',
]);

function formatIssues(label: string, issues: readonly z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `  - ${label}.${path}: ${issue.message}`;
  });
}

function reportAndExit(lines: string[]): never {
  lines.push('Populate the missing keys in .env.local — see .env.example.');
  console.error(lines.join('\n'));
  process.exit(1);
}

function validateEnv(): Env {
  const clientResult = clientSchema.safeParse(process.env);

  // Server bundle: validate both schemas. Browser bundle: skip server schema —
  // those vars are intentionally not exposed to the client. The Proxy guard
  // below still throws if any server key is read in the browser.
  if (typeof window === 'undefined') {
    const serverResult = serverSchema.safeParse(process.env);
    if (!serverResult.success || !clientResult.success) {
      const lines: string[] = ['[Gild] Invalid environment variables:'];
      if (!serverResult.success) {
        lines.push(...formatIssues('server', serverResult.error.issues));
      }
      if (!clientResult.success) {
        lines.push(...formatIssues('client', clientResult.error.issues));
      }
      reportAndExit(lines);
    }
    return { ...serverResult.data, ...clientResult.data };
  }

  if (!clientResult.success) {
    reportAndExit([
      '[Gild] Invalid environment variables:',
      ...formatIssues('client', clientResult.error.issues),
    ]);
  }

  // Browser-only return path. Server fields carry placeholder values that are
  // never read — the Proxy intercepts every server-key access and throws.
  return {
    SUPABASE_SERVICE_ROLE_KEY: '',
    SUPABASE_JWT_SECRET: '',
    DATABASE_URL: '',
    DIRECT_URL: '',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    STRIPE_HOBBY_PRICE_ID: '',
    STRIPE_PRO_PRICE_ID: '',
    NODE_ENV: 'development',
    ...clientResult.data,
  };
}

const parsed = validateEnv();

export const env = new Proxy(parsed, {
  get(target, key) {
    if (typeof window !== 'undefined' && typeof key === 'string' && SERVER_KEYS.has(key)) {
      throw new Error(`[Gild] Server-only env var "${key}" accessed on the client`);
    }
    return Reflect.get(target, key);
  },
});
