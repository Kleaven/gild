export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/billing';
import { env } from '@/lib/env';
import { resolvePlan, extractCustomerId } from '@/lib/billing/plans';
import type { WebhookHandlerMap } from '@/lib/billing';
import db from '@/lib/db';
import { processWebhookEvent } from '@/lib/billing';
import {
  handleConnectSubscriptionUpsert,
  handleConnectSubscriptionDeleted,
} from '@/lib/billing/member-subscription';
import { trackSubscriptionStartedServer } from '@/lib/analytics/server';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveEntityId(customerId: string): Promise<{ id: string, type: 'community' | 'platform' } | null> {
  // Check communities
  const comm = await db<{ id: string }[]>`
    SELECT id FROM public.communities WHERE stripe_customer_id = ${customerId} LIMIT 1
  `;
  if (comm[0]) return { id: comm[0].id, type: 'community' };

  // Check profiles
  const prof = await db<{ id: string }[]>`
    SELECT id FROM public.profiles WHERE stripe_customer_id = ${customerId} LIMIT 1
  `;
  if (prof[0]) return { id: prof[0].id, type: 'platform' };

  return null;
}

// ─── Event handlers ──────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(event: Stripe.Event): Promise<void> {
  // Connected-account events (member tier subscriptions) take a separate path —
  // their customer lives on the creator's account, not in communities/profiles.
  if (event.account) {
    await handleConnectSubscriptionUpsert(event);
    return;
  }

  const sub = event.data.object as Stripe.Subscription;
  const customerId = extractCustomerId(sub.customer);
  
  // Try to get target info from metadata first
  let targetId = sub.metadata.targetId;
  let targetType = sub.metadata.targetType as 'community' | 'platform' | undefined;

  if (!targetId || !targetType) {
    const entity = await resolveEntityId(customerId);
    if (!entity) throw new Error(`Entity not found for customer ${customerId}`);
    targetId = entity.id;
    targetType = entity.type;
  }

  const table = targetType === 'community' ? 'communities' : 'profiles';
  const plan = resolvePlan(sub);

  await db`
    UPDATE public.${db(table)}
    SET
      stripe_subscription_id = ${sub.id},
      subscription_status    = ${sub.status},
      plan                   = ${plan},
      updated_at             = now()
    WHERE id = ${targetId}
  `;

  // Fire the server-side `subscription_started` analytics event only on the
  // initial `created` webhook — the reliable signal regardless of whether the
  // customer's browser ever returned from Stripe Checkout. distinct_id is the
  // Supabase user id so it lines up with client-side identify().
  if (event.type === 'customer.subscription.created') {
    let distinctId = targetId;
    let communityId: string | null = null;

    if (targetType === 'community') {
      communityId = targetId;
      const owner = await db<{ owner_id: string }[]>`
        SELECT owner_id FROM public.communities WHERE id = ${targetId} LIMIT 1
      `;
      if (owner[0]?.owner_id) distinctId = owner[0].owner_id;
    }

    await trackSubscriptionStartedServer({
      distinctId,
      communityId,
      plan,
      trial: sub.status === 'trialing',
    });
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  if (event.account) {
    await handleConnectSubscriptionDeleted(event);
    return;
  }

  const sub = event.data.object as Stripe.Subscription;
  const customerId = extractCustomerId(sub.customer);
  const entity = await resolveEntityId(customerId);
  if (!entity) throw new Error(`Entity not found for customer ${customerId}`);

  const table = entity.type === 'community' ? 'communities' : 'profiles';

  await db`
    UPDATE public.${db(table)}
    SET subscription_status = 'canceled',
        plan                = 'hobby',
        updated_at          = now()
    WHERE id = ${entity.id}
  `;
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  // Connected-account checkouts: paid JOINS grant membership here; tier
  // assignment is driven off customer.subscription.* instead.
  if (event.account) {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata ?? {};
    if (m.type === 'community_join' && m.communityId && m.userId && session.payment_status === 'paid') {
      await db`
        INSERT INTO public.community_members (community_id, user_id, role)
        VALUES (${m.communityId}, ${m.userId}, 'free_member')
        ON CONFLICT (community_id, user_id) DO NOTHING
      `;
    }
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { type, communityId, userId, targetType, targetId, plan } = session.metadata || {};

  // Case 1: One-time Community Join (idempotent — ON CONFLICT DO NOTHING handles replays)
  if (type === 'community_join' && communityId && userId) {
    await db`
      INSERT INTO public.community_members (community_id, user_id, role)
      VALUES (${communityId}, ${userId}, 'free_member')
      ON CONFLICT (community_id, user_id) DO NOTHING
    `;
    return;
  }

  // Case 2: Platform/Community Subscription Initial Setup
  if (targetType && targetId) {
    const table = targetType === 'community' ? 'communities' : 'profiles';
    const status = session.payment_status === 'paid' ? 'active' : 'incomplete';
    
    await db`
      UPDATE public.${db(table)}
      SET 
        stripe_customer_id = ${extractCustomerId(session.customer!)},
        stripe_subscription_id = ${typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null},
        subscription_status = ${status},
        plan = ${plan || 'hobby'},
        updated_at = now()
      WHERE id = ${targetId}
    `;
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
  if (event.account) return; // member-tier status is tracked via subscription.* events
  const inv = event.data.object as Stripe.Invoice;
  if (inv.billing_reason === 'subscription_create') return;

  const customerId = extractCustomerId(inv.customer!);
  const entity = await resolveEntityId(customerId);
  if (!entity) throw new Error(`Entity not found for customer ${customerId}`);

  const table = entity.type === 'community' ? 'communities' : 'profiles';

  await db`
    UPDATE public.${db(table)}
    SET subscription_status = 'active', updated_at = now()
    WHERE id = ${entity.id}
  `;
}

async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  if (event.account) return; // member-tier status is tracked via subscription.* events
  const inv = event.data.object as Stripe.Invoice;
  const customerId = extractCustomerId(inv.customer!);
  const entity = await resolveEntityId(customerId);
  if (!entity) throw new Error(`Entity not found for customer ${customerId}`);

  const table = entity.type === 'community' ? 'communities' : 'profiles';

  await db`
    UPDATE public.${db(table)}
    SET subscription_status = 'past_due', updated_at = now()
    WHERE id = ${entity.id}
  `;
}

// ─── Handler map ─────────────────────────────────────────────────────────────

const handlers: WebhookHandlerMap = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.created': handleSubscriptionUpsert,
  'customer.subscription.updated': handleSubscriptionUpsert,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
};

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing sig' }, { status: 400 });

  // Verify against both signing secrets: the platform endpoint and (if set) the
  // Connect endpoint. Connected-account events (member tier subscriptions) are
  // signed with the Connect endpoint's secret, so a single secret isn't enough.
  const secrets = [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
      break;
    } catch {
      // try the next secret
    }
  }
  if (!event) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  try {
    await processWebhookEvent(event, handlers);
  } catch (err) {
    console.error('[webhook] error:', err);
  }

  return NextResponse.json({ received: true });
}
