export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/billing';
import { env } from '@/lib/env';
import { resolvePlan, extractCustomerId } from '@/lib/billing/plans';
import type { WebhookHandlerMap } from '@/lib/billing';
import db from '@/lib/db';

// ─── Community lookup ────────────────────────────────────────────────────────

async function resolveCommunityId(customerId: string): Promise<string | null> {
  const rows = await db<{ id: string }[]>`
    SELECT id FROM public.communities
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

// ─── Event handlers ──────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const customerId = extractCustomerId(sub.customer);
  const communityId = await resolveCommunityId(customerId);

  if (!communityId) {
    // Community not found — record error and return (Stripe already logged the event)
    throw new Error(`Community not found for customer ${customerId}`);
  }

  await db`
    UPDATE public.communities
    SET
      stripe_subscription_id = ${sub.id},
      subscription_status    = ${sub.status},
      plan                   = ${resolvePlan(sub)}
    WHERE id = ${communityId}
  `;
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const customerId = extractCustomerId(sub.customer);
  const communityId = await resolveCommunityId(customerId);

  if (!communityId) {
    throw new Error(`Community not found for customer ${customerId}`);
  }

  // plan column CHECK allows only 'starter'|'pro' — 'free' is not a valid value.
  // Downgrade to 'starter' on cancellation; subscription_status = 'canceled'
  // is the authoritative signal that billing is inactive.
  await db`
    UPDATE public.communities
    SET subscription_status = 'canceled',
        plan                = 'starter'
    WHERE id = ${communityId}
  `;
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
  const inv = event.data.object as Stripe.Invoice;
  // subscription_create is already handled by subscription.created — skip
  if (inv.billing_reason === 'subscription_create') return;

  const customerId = extractCustomerId(
    inv.customer as string | Stripe.Customer | Stripe.DeletedCustomer,
  );
  const communityId = await resolveCommunityId(customerId);

  if (!communityId) {
    throw new Error(`Community not found for customer ${customerId}`);
  }

  await db`
    UPDATE public.communities
    SET subscription_status = 'active'
    WHERE id = ${communityId}
  `;
}

async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const inv = event.data.object as Stripe.Invoice;
  const customerId = extractCustomerId(
    inv.customer as string | Stripe.Customer | Stripe.DeletedCustomer,
  );
  const communityId = await resolveCommunityId(customerId);

  if (!communityId) {
    throw new Error(`Community not found for customer ${customerId}`);
  }

  await db`
    UPDATE public.communities
    SET subscription_status = 'past_due'
    WHERE id = ${communityId}
  `;
}

// ─── Handler map ─────────────────────────────────────────────────────────────

const handlers: WebhookHandlerMap = {
  'customer.subscription.created': handleSubscriptionUpsert,
  'customer.subscription.updated': handleSubscriptionUpsert,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  // customer.subscription.trial_will_end: no DB update — email handled in Step 50
  // Unknown event types are handled gracefully by processWebhookEvent (marks processed)
};

// ─── Route ───────────────────────────────────────────────────────────────────

// Idempotency is delegated to processWebhookEvent (Gate 2, Step 28):
// INSERT ... ON CONFLICT (provider, event_id) DO NOTHING RETURNING id
// Zero rows → duplicate delivery → immediate 200 return.
// Handler errors → error column set, attempt_count incremented → re-thrown here → 200.
import { processWebhookEvent } from '@/lib/billing';

export async function POST(request: Request): Promise<NextResponse> {
  // Step 1 — Raw body as Buffer (required for Stripe sig verification)
  const rawBody = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Step 2 — Signature verification (before any DB write)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Steps 3-5 — Idempotency, routing, and status update via processWebhookEvent.
  // processWebhookEvent records errors in webhook_events and re-throws — we
  // catch here and always return 200 (500 would cause Stripe to retry indefinitely).
  try {
    await processWebhookEvent(event, handlers);
  } catch (err) {
    console.error('[webhook] processing error:', err instanceof Error ? err.message : 'unknown');
  }

  return NextResponse.json({ received: true });
}
