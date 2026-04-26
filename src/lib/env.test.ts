import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validEnv: Record<string, string> = {
  SUPABASE_SERVICE_ROLE_KEY: 'srk_test',
  SUPABASE_JWT_SECRET: 'jwt_test',
  DATABASE_URL: 'postgresql://user:pw@host:6543/postgres?pgbouncer=true',
  DIRECT_URL: 'postgresql://user:pw@host:5432/postgres',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
};

const ENV_KEYS = Object.keys(validEnv);
let snapshot: NodeJS.ProcessEnv;

beforeEach(() => {
  snapshot = { ...process.env };
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  vi.resetModules();
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, snapshot);
  vi.restoreAllMocks();
});

function applyEnv(values: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function spyExitThrow(): void {
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${String(code)})`);
  });
}

function captureConsoleError(): { read: () => string } {
  let buffer = '';
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    buffer += args.map(String).join(' ');
  });
  return { read: () => buffer };
}

describe('env validation', () => {
  it('passes with full valid env', async () => {
    applyEnv(validEnv);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${String(code)})`);
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const mod = await import('./env');
    expect(mod.env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
  });

  it('exits when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    applyEnv({ ...validEnv, SUPABASE_SERVICE_ROLE_KEY: undefined });
    spyExitThrow();
    const errors = captureConsoleError();
    await expect(import('./env')).rejects.toThrow(/process\.exit/);
    expect(errors.read()).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('rejects an invalid NEXT_PUBLIC_SUPABASE_URL', async () => {
    applyEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });
    spyExitThrow();
    const errors = captureConsoleError();
    await expect(import('./env')).rejects.toThrow(/process\.exit/);
    expect(errors.read()).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it("defaults NODE_ENV to 'development' when absent", async () => {
    applyEnv({ ...validEnv, NODE_ENV: undefined });
    spyExitThrow();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const mod = await import('./env');
    expect(mod.env.NODE_ENV).toBe('development');
  });

  it('rejects empty DATABASE_URL', async () => {
    applyEnv({ ...validEnv, DATABASE_URL: '' });
    spyExitThrow();
    const errors = captureConsoleError();
    await expect(import('./env')).rejects.toThrow(/process\.exit/);
    expect(errors.read()).toContain('DATABASE_URL');
  });
});
