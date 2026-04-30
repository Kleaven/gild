import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import postgres from 'postgres';

/**
 * Gate 2 — Webhook Idempotency Test Harness
 *
 * Proves that processWebhookEvent():
 * 1. Inserts on first delivery and returns true
 * 2. Returns false on duplicate delivery (same event_id)
 * 3. Captures handler errors into the error column and re-throws
 * 4. Handles unregistered event types gracefully
 *
 * Uses a direct postgres-js connection to staging (bypasses env.ts validation).
 * The test event IDs are prefixed with 'evt_test_gate2_' for easy cleanup.
 */

// Mock 'server-only' so Vitest can import server modules
vi.mock('server-only', () => ({}));

// Mock db module to use a direct connection string, bypassing env.ts validation
const TEST_DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres.fvgxekptovclduxfaamk:NM1LMDKutoFeq0L4@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require';
const testDb = postgres(TEST_DB_URL, { max: 2 });

vi.mock('../db', () => ({
  default: testDb,
}));

const TEST_PREFIX = 'evt_test_gate2_';

function makeFakeEvent(
  id: string,
  type: string = 'checkout.session.completed',
): Stripe.Event {
  return {
    id: `${TEST_PREFIX}${id}`,
    object: 'event',
    type,
    api_version: '2026-04-22',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: { id: 'cs_test_fake' } as unknown as Stripe.Event.Data.Object,
    },
  } as Stripe.Event;
}

let processWebhookEvent: typeof import('./webhook').processWebhookEvent;

beforeAll(async () => {
  const webhookModule = await import('./webhook');
  processWebhookEvent = webhookModule.processWebhookEvent;

  // Clean up any leftover test rows from previous runs
  await testDb`DELETE FROM public.webhook_events WHERE event_id LIKE ${TEST_PREFIX + '%'}`;
});

afterAll(async () => {
  await testDb`DELETE FROM public.webhook_events WHERE event_id LIKE ${TEST_PREFIX + '%'}`;
  await testDb.end();
});

describe('Gate 2: webhook idempotency', () => {
  it('inserts on first delivery and returns true', async () => {
    const event = makeFakeEvent('first_delivery');
    const result = await processWebhookEvent(event, {});
    expect(result).toBe(true);

    // Verify row exists in DB
    const rows = await testDb`
      SELECT event_id, event_type, processed_at
      FROM public.webhook_events
      WHERE event_id = ${event.id}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.event_type).toBe('checkout.session.completed');
    expect(rows[0]!.processed_at).not.toBeNull();
  });

  it('returns false on duplicate delivery (same event_id)', async () => {
    const event = makeFakeEvent('duplicate_test');

    // First delivery
    const first = await processWebhookEvent(event, {});
    expect(first).toBe(true);

    // Second delivery — must be silently dropped
    const second = await processWebhookEvent(event, {});
    expect(second).toBe(false);

    // Only one row in DB
    const rows = await testDb`
      SELECT id FROM public.webhook_events WHERE event_id = ${event.id}
    `;
    expect(rows).toHaveLength(1);
  });

  it('captures handler errors and re-throws', async () => {
    const event = makeFakeEvent('error_test');
    const failingHandlers = {
      'checkout.session.completed': async () => {
        throw new Error('Simulated payment processing failure');
      },
    };

    await expect(
      processWebhookEvent(event, failingHandlers),
    ).rejects.toThrow('Simulated payment processing failure');

    // Error should be recorded in DB
    const rows = await testDb`
      SELECT error, attempt_count, processed_at
      FROM public.webhook_events
      WHERE event_id = ${event.id}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.error).toBe('Simulated payment processing failure');
    expect(rows[0]!.attempt_count).toBe(1);
    expect(rows[0]!.processed_at).toBeNull(); // NOT marked as processed
  });

  it('handles unregistered event types gracefully', async () => {
    const event = makeFakeEvent('unhandled_type', 'some.unknown.event');
    const result = await processWebhookEvent(event, {});
    expect(result).toBe(true);

    // Should still be marked as processed
    const rows = await testDb`
      SELECT processed_at FROM public.webhook_events WHERE event_id = ${event.id}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.processed_at).not.toBeNull();
  });
});
