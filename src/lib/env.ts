// Schema grows with the build — see CLAUDE.md migration sequence.
// Add Stripe vars at Step 27, Upstash at Step 33,
// Cloudflare at Step 46, Resend at Step 50.

import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
type Env = ServerEnv & ClientEnv;

const SERVER_KEYS = new Set<string>([
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'NODE_ENV',
]);

function formatIssues(label: string, issues: readonly z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `  - ${label}.${path}: ${issue.message}`;
  });
}

function validateEnv(): Env {
  const serverResult = serverSchema.safeParse(process.env);
  const clientResult = clientSchema.safeParse(process.env);

  if (!serverResult.success || !clientResult.success) {
    const lines: string[] = ['[Gild] Invalid environment variables:'];
    if (!serverResult.success) {
      lines.push(...formatIssues('server', serverResult.error.issues));
    }
    if (!clientResult.success) {
      lines.push(...formatIssues('client', clientResult.error.issues));
    }
    lines.push('Populate the missing keys in .env.local — see .env.example.');
    console.error(lines.join('\n'));
    process.exit(1);
  }

  return { ...serverResult.data, ...clientResult.data };
}

const parsed = validateEnv();

export const env = new Proxy(parsed, {
  get(target, key) {
    if (
      typeof window !== 'undefined' &&
      typeof key === 'string' &&
      SERVER_KEYS.has(key)
    ) {
      throw new Error(
        `[Gild] Server-only env var "${key}" accessed on the client`,
      );
    }
    return Reflect.get(target, key);
  },
});
