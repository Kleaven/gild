import 'server-only';

import db from '../db';
import type Stripe from 'stripe';

export type WebhookHandlerMap = Record<
  string,
  (event: Stripe.Event) => Promise<void>
>;

/**
 * Idempotent webhook event processor.
 *
 * 1. Upserts the event into webhook_events — ON CONFLICT returns 0 rows
 *    if the event was already recorded (duplicate delivery from Stripe).
 * 2. If a handler is registered for the event type, executes it.
 * 3. Marks the event as processed, or captures the error for observability.
 *
 * Returns true if the event was freshly processed, false if duplicate.
 */
export async function processWebhookEvent(
  event: Stripe.Event,
  handlers: WebhookHandlerMap,
): Promise<boolean> {
  // 1. Idempotent upsert — duplicate deliveries silently return 0 rows
  const inserted = await db`
    INSERT INTO public.webhook_events (event_id, event_type, provider, payload)
    VALUES (${event.id}, ${event.type}, 'stripe', ${JSON.stringify(event)})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id
  `;

  if (inserted.length === 0) {
    return false;
  }

  const rowId = inserted[0]!.id as string;

  // 2. Dispatch to handler if one is registered for this event type
  const handler = handlers[event.type];
  if (!handler) {
    // No handler registered — mark as processed (nothing to do)
    await db`
      UPDATE public.webhook_events
      SET processed_at = now(), attempt_count = attempt_count + 1
      WHERE id = ${rowId}
    `;
    return true;
  }

  // 3. Execute handler, capture errors for observability
  try {
    await handler(event);
    await db`
      UPDATE public.webhook_events
      SET processed_at = now(), attempt_count = attempt_count + 1
      WHERE id = ${rowId}
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await db`
      UPDATE public.webhook_events
      SET error = ${message}, attempt_count = attempt_count + 1
      WHERE id = ${rowId}
    `;
    throw err; // Re-throw so the route returns 500 and Stripe retries
  }

  return true;
}
