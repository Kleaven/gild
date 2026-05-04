import 'server-only';

import { stripe } from './stripe';
import { PLANS } from './catalog';
import type { Plan } from './plans';
import db from '../db';
import { env } from '../env';

// NEXT_PUBLIC_APP_URL is in the client schema and available server-side.
const APP_URL = env.NEXT_PUBLIC_APP_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

type CommunityBillingRow = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  plan: string;
};

// ─── createCheckoutSession ────────────────────────────────────────────────────

export async function createCheckoutSession(
  communityId: string,
  plan: Plan,
  ownerEmail: string,
  // returnBasePath lets callers override the Stripe return destination.
  // Defaults to /c/[communityId]/settings (post-onboarding management).
  // Pass /onboarding/[communityId]/checkout from the onboarding flow.
  returnBasePath = `/c/${communityId}/settings`,
): Promise<{ url: string }> {
  // Step 1 — Fetch community billing state
  const rows = await db<CommunityBillingRow[]>`
    SELECT id, stripe_customer_id, stripe_subscription_id, subscription_status, plan
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const community = rows[0];
  if (!community) throw new Error('[gild] community not found');

  if (
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing'
  ) {
    throw new Error('[gild] already subscribed');
  }

  // Step 2 — Get or create Stripe customer
  let customerId: string;
  if (!community.stripe_customer_id) {
    const customer = await stripe.customers.create({
      email: ownerEmail,
      metadata: { communityId },
    });
    await db`
      UPDATE public.communities
      SET stripe_customer_id = ${customer.id}
      WHERE id = ${communityId}
    `;
    customerId = customer.id;
  } else {
    customerId = community.stripe_customer_id;
  }

  // Step 3 — Create checkout session
  // success_url and cancel_url always constructed server-side — never from caller
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${APP_URL}${returnBasePath}?checkout=success`,
    cancel_url: `${APP_URL}${returnBasePath}?checkout=cancelled`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { communityId, plan },
    },
    metadata: { communityId, plan },
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error('[gild] checkout session has no URL');
  return { url: session.url };
}

// ─── createBillingPortalSession ───────────────────────────────────────────────

export async function createBillingPortalSession(
  communityId: string,
): Promise<{ url: string }> {
  // Step 1 — Fetch stripe_customer_id
  const rows = await db<{ stripe_customer_id: string | null }[]>`
    SELECT stripe_customer_id
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.stripe_customer_id) {
    throw new Error('[gild] no billing account found — complete checkout first');
  }

  // Step 2 — Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${APP_URL}/c/${communityId}/settings`,
  });

  return { url: session.url };
}

// ─── cancelSubscription ───────────────────────────────────────────────────────

export async function cancelSubscription(communityId: string): Promise<void> {
  // Step 1 — Fetch stripe_subscription_id
  const rows = await db<{ stripe_subscription_id: string | null }[]>`
    SELECT stripe_subscription_id
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.stripe_subscription_id) {
    throw new Error('[gild] no active subscription');
  }

  // Step 2 — Cancel at period end (never immediately)
  // Webhook handler owns all subscription_status updates — do NOT update here
  await stripe.subscriptions.update(row.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
}
