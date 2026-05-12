export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/billing';
import { env } from '@/lib/env';
import { resolvePlan, extractCustomerId } from '@/lib/billing/plans';
import type { WebhookHandlerMap } from '@/lib/billing';
import db from '@/lib/db';
import { queueDunningEmail } from '@/lib/billing/dunning';
import { processWebhookEvent } from '@/lib/billing';

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

  await db`
    UPDATE public.${db(table)}
    SET
      stripe_subscription_id = ${sub.id},
      subscription_status    = ${sub.status},
      plan                   = ${resolvePlan(sub)},
      updated_at             = now()
    WHERE id = ${targetId}
  `;
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
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
  const session = event.data.object as Stripe.CheckoutSession;
  const { type, communityId, userId, targetType, targetId, plan } = session.metadata || {};

  // Case 1: One-time Community Join
  if (type === 'community_join' && communityId && userId) {
    await db.rpc('join_community', {
      p_community_id: communityId,
      p_user_id: userId
    });
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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  try {
    await processWebhookEvent(event, handlers);
  } catch (err) {
    console.error('[webhook] error:', err);
  }

  return NextResponse.json({ received: true });
}
