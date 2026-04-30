import { config } from 'dotenv';
// Load .env.local before any code accesses process.env
config({ path: '.env.local' });

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type {
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

/**
 * Gate 3 Part A — WebAuthn E2E Integration Tests
 *
 * Requirements implemented:
 * 1. Redis fallback — uses in-memory Map if Upstash credentials are placeholders
 * 2. Replay protection — negative test for stale sign_count
 * 3. RLS integrity — verifies credential isolation with unprivileged client
 * 4. Collision-proof — unique email per run via Date.now()
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}));

// Requirement 1: Always use in-memory Redis mock for test isolation
// vi.mock hoists to the top; use a global for the store
vi.mock('@upstash/redis', () => {
  const store = new Map<string, string>();
  return {
    Redis: class MockRedis {
      // Accept and ignore constructor args
      constructor(_opts?: unknown) {}
      async set(key: string, value: string): Promise<void> {
        store.set(key, value);
      }
      async get<T>(key: string): Promise<T | null> {
        return (store.get(key) as T) ?? null;
      }
      async del(key: string): Promise<void> {
        store.delete(key);
      }
    },
  };
});

// Mock only verification functions — keep option generation real
const mockVerifyRegistration = vi.fn();
const mockVerifyAuthentication = vi.fn();

vi.mock('@simplewebauthn/server', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@simplewebauthn/server')
  >();
  return {
    ...actual,
    verifyRegistrationResponse: mockVerifyRegistration,
    verifyAuthenticationResponse: mockVerifyAuthentication,
  };
});

// Mock db module (same pattern as webhook.test.ts)
const TEST_DB_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres.fvgxekptovclduxfaamk:NM1LMDKutoFeq0L4@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require';
const testDb = postgres(TEST_DB_URL, { max: 2 });
vi.mock('../../db', () => ({ default: testDb }));

// Mock env module — must provide REAL Supabase credentials for the service client
// used internally by the WebAuthn functions
vi.mock('../../env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    NODE_ENV: 'test',
  },
}));

// ── Test State ─────────────────────────────────────────────────────────────

// Requirement 4: Collision-proof unique identifier per run
const RUN_ID = Date.now();
const TEST_EMAIL = `gate3-${RUN_ID}@gild.test`;
const FAKE_CREDENTIAL_ID = `cred_test_${RUN_ID}`;
const FAKE_PUBLIC_KEY = Buffer.from(`pk_test_${RUN_ID}`).toString('base64');

let testAdminId: string;
let testUserId: string;

// Supabase clients (real credentials loaded by dotenv above)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service client for setup/teardown (bypasses RLS)
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Requirement 3: Unprivileged client for RLS verification
const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Dynamic imports (after mocks)
let generateAdminRegistrationOptions: typeof import('./index').generateAdminRegistrationOptions;
let verifyAdminRegistration: typeof import('./index').verifyAdminRegistration;
let generateAdminAuthenticationOptions: typeof import('./index').generateAdminAuthenticationOptions;
let verifyAdminAuthentication: typeof import('./index').verifyAdminAuthentication;

// ── Setup & Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  // Import WebAuthn functions after mocks are registered
  const mod = await import('./index');
  generateAdminRegistrationOptions = mod.generateAdminRegistrationOptions;
  verifyAdminRegistration = mod.verifyAdminRegistration;
  generateAdminAuthenticationOptions = mod.generateAdminAuthenticationOptions;
  verifyAdminAuthentication = mod.verifyAdminAuthentication;

  // Create a test user in auth.users via service client
  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: `test_password_${RUN_ID}`,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }
  testUserId = authUser.user.id;

  // Create a profile for the test user
  await serviceClient.from('profiles').insert({
    id: testUserId,
    display_name: 'Gate3 Test Admin',
    username: `gate3_admin_${RUN_ID}`,
  });

  // Insert test admin into platform_admins
  const { data: adminRow, error: adminError } = await serviceClient
    .from('platform_admins')
    .insert({ user_id: testUserId, email: TEST_EMAIL })
    .select('id')
    .single();

  if (adminError || !adminRow) {
    throw new Error(`Failed to create test admin: ${adminError?.message}`);
  }
  testAdminId = adminRow.id;

  // Clean up any leftover credentials from crashed previous runs
  await testDb`DELETE FROM public.webauthn_credentials WHERE admin_id = ${testAdminId}`;
});

afterAll(async () => {
  // Cleanup in correct FK order
  if (testAdminId) {
    await testDb`DELETE FROM public.webauthn_credentials WHERE admin_id = ${testAdminId}`;
    await testDb`DELETE FROM public.platform_admins WHERE id = ${testAdminId}`;
  }
  if (testUserId) {
    await testDb`DELETE FROM public.profiles WHERE id = ${testUserId}`;
    await serviceClient.auth.admin.deleteUser(testUserId);
  }
  await testDb.end();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Gate 3A: WebAuthn registration flow', () => {
  it('generates registration options for a platform admin', async () => {
    const result = await generateAdminRegistrationOptions(
      testAdminId,
      TEST_EMAIL,
    );

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.challenge).toBeDefined();
    expect(result.data!.rp.name).toBe('Gild');
    expect(result.data!.user.name).toBe(TEST_EMAIL);
  });

  it('stores a credential after successful registration verification', async () => {
    // Generate options to set the challenge in the mock Redis
    await generateAdminRegistrationOptions(testAdminId, TEST_EMAIL);

    // Mock a successful verification response
    mockVerifyRegistration.mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        credential: {
          id: FAKE_CREDENTIAL_ID,
          publicKey: Buffer.from(FAKE_PUBLIC_KEY, 'base64'),
          counter: 0,
          transports: ['internal'],
        },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        fmt: 'none',
        attestationObject: new Uint8Array(),
        userVerified: true,
        credentialType: 'public-key',
        aaguid: '00000000-0000-0000-0000-000000000000',
        rpIdHash: new Uint8Array(),
        origin: 'http://localhost:3000',
        flags: {
          up: true,
          uv: true,
          be: true,
          bs: true,
          at: true,
          ed: false,
          flagsInt: 0,
        },
      },
    } as unknown as VerifiedRegistrationResponse);

    const fakeResponse = {
      id: FAKE_CREDENTIAL_ID,
      rawId: FAKE_CREDENTIAL_ID,
      response: {
        clientDataJSON: '',
        attestationObject: '',
      },
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
    } as unknown as RegistrationResponseJSON;

    const result = await verifyAdminRegistration(testAdminId, fakeResponse);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.credentialId).toBe(FAKE_CREDENTIAL_ID);

    // Verify credential actually stored in DB
    const rows = await testDb`
      SELECT credential_id, public_key, sign_count, device_type, backed_up
      FROM public.webauthn_credentials
      WHERE admin_id = ${testAdminId} AND credential_id = ${FAKE_CREDENTIAL_ID}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.credential_id).toBe(FAKE_CREDENTIAL_ID);
    expect(Number(rows[0]!.sign_count)).toBe(0);
    expect(rows[0]!.device_type).toBe('multiDevice');
    expect(rows[0]!.backed_up).toBe(true);
  });

  it('rejects registration when challenge is missing/expired', async () => {
    // Do NOT generate options first — no challenge in store
    const fakeResponse = {
      id: 'orphan_cred',
      rawId: 'orphan_cred',
      response: { clientDataJSON: '', attestationObject: '' },
      type: 'public-key',
      clientExtensionResults: {},
    } as unknown as RegistrationResponseJSON;

    const result = await verifyAdminRegistration(testAdminId, fakeResponse);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('SESSION_EXPIRED');
  });
});

describe('Gate 3A: WebAuthn authentication flow', () => {
  it('generates authentication options listing registered credentials', async () => {
    const result = await generateAdminAuthenticationOptions(testAdminId);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.challenge).toBeDefined();
    expect(result.data!.allowCredentials).toBeDefined();
    expect(result.data!.allowCredentials!.length).toBeGreaterThanOrEqual(1);
    expect(result.data!.allowCredentials![0]!.id).toBe(FAKE_CREDENTIAL_ID);
  });

  it('updates sign_count after successful authentication', async () => {
    // Generate options to set challenge
    await generateAdminAuthenticationOptions(testAdminId);

    // Mock successful verification with incremented counter
    mockVerifyAuthentication.mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        newCounter: 1,
        credentialID: FAKE_CREDENTIAL_ID,
        userVerified: true,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
        authenticatorExtensionResults: undefined,
      },
    } as unknown as VerifiedAuthenticationResponse);

    const fakeResponse = {
      id: FAKE_CREDENTIAL_ID,
      rawId: FAKE_CREDENTIAL_ID,
      response: {
        clientDataJSON: '',
        authenticatorData: '',
        signature: '',
      },
      type: 'public-key',
      clientExtensionResults: {},
    } as unknown as AuthenticationResponseJSON;

    const result = await verifyAdminAuthentication(testAdminId, fakeResponse);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ verified: true });

    // Verify sign_count was updated in DB
    const rows = await testDb`
      SELECT sign_count, last_used_at
      FROM public.webauthn_credentials
      WHERE admin_id = ${testAdminId} AND credential_id = ${FAKE_CREDENTIAL_ID}
    `;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0]!.sign_count)).toBe(1);
    expect(rows[0]!.last_used_at).not.toBeNull();
  });

  // Requirement 2: Replay protection negative test
  it('rejects authentication with stale sign_count (replay attack)', async () => {
    // Generate options to set challenge
    await generateAdminAuthenticationOptions(testAdminId);

    // Mock verification failure — simplewebauthn throws when counter is stale
    mockVerifyAuthentication.mockRejectedValueOnce(
      new Error(
        'Response counter value 0 is not greater than stored counter value 1',
      ),
    );

    const fakeResponse = {
      id: FAKE_CREDENTIAL_ID,
      rawId: FAKE_CREDENTIAL_ID,
      response: {
        clientDataJSON: '',
        authenticatorData: '',
        signature: '',
      },
      type: 'public-key',
      clientExtensionResults: {},
    } as unknown as AuthenticationResponseJSON;

    const result = await verifyAdminAuthentication(testAdminId, fakeResponse);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    // sign_count should NOT have been updated (stayed at 1)
    const rows = await testDb`
      SELECT sign_count
      FROM public.webauthn_credentials
      WHERE admin_id = ${testAdminId} AND credential_id = ${FAKE_CREDENTIAL_ID}
    `;
    expect(Number(rows[0]!.sign_count)).toBe(1);
  });

  it('rejects authentication with unknown credential', async () => {
    await generateAdminAuthenticationOptions(testAdminId);

    const fakeResponse = {
      id: 'nonexistent_credential_id',
      rawId: 'nonexistent_credential_id',
      response: {
        clientDataJSON: '',
        authenticatorData: '',
        signature: '',
      },
      type: 'public-key',
      clientExtensionResults: {},
    } as unknown as AuthenticationResponseJSON;

    const result = await verifyAdminAuthentication(testAdminId, fakeResponse);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('USER_NOT_FOUND');
  });
});

// Requirement 3: RLS integrity verification
describe('Gate 3A: WebAuthn RLS isolation', () => {
  it('platform admin can read own credentials via RLS', async () => {
    // Sign in as the test admin user
    const { data: signIn } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: `test_password_${RUN_ID}`,
    });

    expect(signIn.session).not.toBeNull();

    // Create an authenticated client with the user's session
    const authedClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${signIn.session!.access_token}`,
        },
      },
    });

    const { data, error } = await authedClient
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('admin_id', testAdminId);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    expect(data![0]!.credential_id).toBe(FAKE_CREDENTIAL_ID);
  });

  it('non-admin user cannot read webauthn_credentials', async () => {
    // Create a second throwaway user who is NOT a platform admin
    const { data: otherUser } =
      await serviceClient.auth.admin.createUser({
        email: `gate3-rls-other-${RUN_ID}@gild.test`,
        password: `other_password_${RUN_ID}`,
        email_confirm: true,
      });

    expect(otherUser.user).not.toBeNull();
    const otherUserId = otherUser.user!.id;

    // Create a profile for this user
    await serviceClient.from('profiles').insert({
      id: otherUserId,
      display_name: 'RLS Other User',
      username: `rls_other_${RUN_ID}`,
    });

    // Sign in as the non-admin user
    const { data: signIn } = await anonClient.auth.signInWithPassword({
      email: `gate3-rls-other-${RUN_ID}@gild.test`,
      password: `other_password_${RUN_ID}`,
    });

    const otherClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${signIn.session!.access_token}`,
        },
      },
    });

    // This user should see ZERO webauthn credentials
    const { data } = await otherClient
      .from('webauthn_credentials')
      .select('credential_id');

    expect(data).not.toBeNull();
    expect(data!.length).toBe(0);

    // Cleanup the other user
    await testDb`DELETE FROM public.profiles WHERE id = ${otherUserId}`;
    await serviceClient.auth.admin.deleteUser(otherUserId);
  });
});
