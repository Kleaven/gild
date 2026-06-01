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
  // Optional second signing secret for the Stripe Connect webhook endpoint
  // (connected-account events: member tier subscriptions). Set once the Connect
  // endpoint exists in Stripe; the route verifies against both secrets.
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_HOBBY_PRICE_ID: z.string().min(1),
  STRIPE_PRO_PRICE_ID: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Sentry — optional. Source-map upload skipped if any are missing.
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  // Sentry DSN is safe to expose (publishable identifier). Optional — when
  // empty, both client and server Sentry.init() short-circuit without error.
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  // PostHog project API key — publishable, designed to live in browser
  // bundles. Host is the ingest endpoint (us.i.posthog.com or eu.i…).
  // Both optional so dev/preview without analytics still validates.
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
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
  'CRON_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NODE_ENV',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
]);

function formatIssues(label: string, issues: readonly z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `  - ${label}.${path}: ${issue.message}`;
  });
}

function reportAndExit(lines: string[]): never {
  const message = lines.join('\n');
  console.error(message);
  throw new Error(message);
}

function validateEnv(): Env {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };

  const clientResult = clientSchema.safeParse(clientEnv);

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
    return { ...serverResult.data, ...clientResult.data } as Env;
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
    STRIPE_CONNECT_WEBHOOK_SECRET: undefined,
    STRIPE_HOBBY_PRICE_ID: '',
    STRIPE_PRO_PRICE_ID: '',
    CRON_SECRET: '',
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    NODE_ENV: 'development',
    SENTRY_AUTH_TOKEN: undefined,
    SENTRY_ORG: undefined,
    SENTRY_PROJECT: undefined,
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
