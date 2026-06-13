import 'server-only';

import { headers } from 'next/headers';
import { stripe } from './stripe';
import { PLANS } from './catalog';
import type { Plan } from './plans';
import db from '../db';
import { env } from '../env';

async function getAppUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    // Outside request context (build time, cron) — fall back to env
  }
  return env.NEXT_PUBLIC_APP_URL;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type BillingRow = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  plan: string | null;
};

export type CheckoutReturnContext = 'settings' | 'onboarding' | 'global' | 'billing';

// ─── createCheckoutSession ────────────────────────────────────────────────────
// Handles both Community and Platform (User) level checkouts.
// Supports plan switching (upgrade/downgrade) for existing subscriptions.

export async function createCheckoutSession(
  targetId: string, // communityId OR userId
  plan: Plan,
  email: string,
  targetType: 'community' | 'platform',
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const appUrl = await getAppUrl();

  // Step 1 — Fetch current billing state
  const tableIdent = targetType === 'community' ? 'communities' : 'profiles';
  const rows = await db<BillingRow[]>`
    SELECT id, stripe_customer_id, stripe_subscription_id, subscription_status, plan
    FROM public.${db(tableIdent)}
    WHERE id = ${targetId}
    LIMIT 1
  `;
  const entity = rows[0];
  if (!entity) throw new Error(`[gild] ${targetType} not found`);

  // Step 2 — Handle Plan Switching for active subscriptions
  if (
    entity.stripe_subscription_id && 
    (entity.subscription_status === 'active' || entity.subscription_status === 'trialing')
  ) {
    // If they are already on this plan, just return a portal URL
    if (entity.plan === plan) {
      return createBillingPortalSession(targetId, targetType, returnContext);
    }

    // Otherwise, use Stripe Checkout to switch plans (upgrade/downgrade)
    // We update the existing subscription instead of creating a new one.
    const returnPath = await getReturnPath(targetId, targetType, returnContext);
    const session = await stripe.checkout.sessions.create({
      customer: entity.stripe_customer_id!,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${appUrl}${returnPath}?checkout=success`,
      cancel_url: `${appUrl}${returnPath}?checkout=cancelled`,
      subscription_data: {
        metadata: { targetId, plan, targetType },
      },
      metadata: { targetId, plan, targetType },
    });

    if (!session.url) throw new Error('[gild] checkout session has no URL');
    return { url: session.url };
  }

  // Step 3 — New Subscription Flow
  let customerId: string;
  if (!entity.stripe_customer_id) {
    const customer = await stripe.customers.create({
      email: email,
      metadata: { targetId, targetType },
    });
    await db`
      UPDATE public.${db(tableIdent)}
      SET stripe_customer_id = ${customer.id}
      WHERE id = ${targetId}
    `;
    customerId = customer.id;
  } else {
    customerId = entity.stripe_customer_id;
  }

  const returnPath = await getReturnPath(targetId, targetType, returnContext);
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${appUrl}${returnPath}?checkout=success`,
    cancel_url: `${appUrl}${returnPath}?checkout=cancelled`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { targetId, plan, targetType },
    },
    metadata: { targetId, plan, targetType },
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error('[gild] checkout session has no URL');
  return { url: session.url };
}

// ─── createBillingPortalSession ───────────────────────────────────────────────

export async function createBillingPortalSession(
  targetId: string,
  targetType: 'community' | 'platform',
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const appUrl = await getAppUrl();
  const tableIdent = targetType === 'community' ? 'communities' : 'profiles';
  const rows = await db<{ stripe_customer_id: string | null }[]>`
    SELECT stripe_customer_id
    FROM public.${db(tableIdent)}
    WHERE id = ${targetId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.stripe_customer_id) {
    throw new Error('[gild] no billing account found — complete checkout first');
  }

  const portalReturnPath = await getReturnPath(targetId, targetType, returnContext);
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${appUrl}${portalReturnPath}`,
  });

  return { url: session.url };
}

// ─── cancelSubscription ───────────────────────────────────────────────────────

export async function cancelSubscription(
  targetId: string,
  targetType: 'community' | 'platform',
): Promise<void> {
  const tableIdent = targetType === 'community' ? 'communities' : 'profiles';
  const rows = await db<{ stripe_subscription_id: string | null }[]>`
    SELECT stripe_subscription_id
    FROM public.${db(tableIdent)}
    WHERE id = ${targetId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.stripe_subscription_id) {
    throw new Error('[gild] no active subscription');
  }

  await stripe.subscriptions.update(row.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
}


// ─── createCommunityJoinSession ──────────────────────────────────────────────
// Handles one-time payment checkouts for users joining a paid community.

export async function createCommunityJoinSession(
  communityId: string,
  userId: string,
  email: string,
): Promise<{ url: string }> {
  const appUrl = await getAppUrl();
  const rows = await db<{
    name: string; price_amount: number; price_currency: string; pricing_period: string; slug: string;
    stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean;
  }[]>`
    SELECT name, price_amount, price_currency, pricing_period, slug,
           stripe_connect_account_id, stripe_connect_charges_enabled
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const community = rows[0];
  if (!community) throw new Error('[gild] community not found');

  // Entry fees charge DIRECTLY on the creator's connected Stripe account —
  // the same 0% rails as tiers. Without a payout account there is nowhere
  // for the money to go, so paid joins are blocked until Connect is ready.
  if (!community.stripe_connect_account_id || !community.stripe_connect_charges_enabled) {
    throw new Error('[gild] this community can’t accept payments yet — the owner hasn’t finished payout setup');
  }

  const isRecurring = community.pricing_period === 'monthly' || community.pricing_period === 'yearly';

  const session = await stripe.checkout.sessions.create({
    mode: isRecurring ? 'subscription' : 'payment',
    customer_email: email,
    line_items: [{
      price_data: {
        currency: community.price_currency.toLowerCase(),
        product_data: {
          name: `Access to ${community.name}`,
          description: isRecurring 
            ? `Recurring ${community.pricing_period} membership for ${community.name}.`
            : `One-time payment for lifetime access to the ${community.name} community.`,
        },
        unit_amount: Math.round(community.price_amount * 100),
        ...(isRecurring && {
          recurring: {
            interval: community.pricing_period === 'monthly' ? 'month' : 'year',
          },
        }),
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/c/${community.slug}?welcome=1&payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/c/${community.slug}?payment=cancelled`,
    metadata: { 
      communityId, 
      userId, 
      type: 'community_join' 
    },
    subscription_data: isRecurring ? {
      metadata: { communityId, userId, type: 'community_join' }
    } : undefined,
  }, { stripeAccount: community.stripe_connect_account_id });

  if (!session.url) throw new Error('[gild] checkout session has no URL');
  return { url: session.url };
}

// Confirms a paid-join Checkout on return from Stripe and grants membership
// immediately — webhook-independent, mirroring tier confirm-on-return.
// Validates the session's metadata against the signed-in caller; idempotent.
export async function confirmJoinCheckout(
  communityId: string,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db<{ stripe_connect_account_id: string | null }[]>`
    SELECT stripe_connect_account_id FROM public.communities WHERE id = ${communityId} LIMIT 1
  `;
  const account = rows[0]?.stripe_connect_account_id;
  if (!account) return false;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, undefined, { stripeAccount: account });
  } catch {
    return false;
  }

  const m = session.metadata ?? {};
  if (m.type !== 'community_join' || m.communityId !== communityId || m.userId !== userId) return false;
  if (session.payment_status !== 'paid') return false;

  await db`
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (${communityId}, ${userId}, 'free_member')
    ON CONFLICT (community_id, user_id) DO NOTHING
  `;
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Async because the community branch resolves UUID→slug before generating
// the URL (routes are slug-keyed; a UUID return-path would 404 the user
// after they finish Stripe checkout).
async function getReturnPath(
  targetId: string,
  targetType: 'community' | 'platform',
  context: CheckoutReturnContext,
): Promise<string> {
  if (targetType === 'platform') return '/settings/billing';

  if (context === 'onboarding') return `/onboarding/${targetId}/checkout`;

  const { resolveCommunitySlug } = await import('../community/context');
  const slug = await resolveCommunitySlug(targetId);
  return context === 'billing' ? `/c/${slug}/billing` : `/c/${slug}/settings`;
}
