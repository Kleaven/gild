import 'server-only';

import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from './stripe';
import db from '../db';
import { env } from '../env';

// ─── Member tier subscriptions (Stripe Connect, direct charges) ─────────────
// Members subscribe to a community's tier; the charge lands on the creator's
// connected account with a 0% application fee. One active subscription per
// membership: switching tiers swaps the price (with proration), never opens a
// second subscription. Webhooks for connected accounts keep state in sync.

async function getAppUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    // Outside a request — fall back to env.
  }
  return env.NEXT_PUBLIC_APP_URL;
}

const SUB_KIND = 'tier_subscription';

function customerId(c: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!c) return null;
  return typeof c === 'string' ? c : c.id;
}

// current_period_end moved onto subscription items in recent API versions.
function periodEndISO(sub: Stripe.Subscription): string | null {
  const ts = sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

type MemberBilling = {
  role: string;
  tier_id: string | null;
  tier_status: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
};

async function getMemberBilling(communityId: string, userId: string): Promise<MemberBilling | null> {
  const rows = await db<MemberBilling[]>`
    SELECT role, tier_id, tier_status, stripe_subscription_id, stripe_customer_id
    FROM public.community_members
    WHERE community_id = ${communityId} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

type CommunityPayout = {
  slug: string;
  stripe_connect_account_id: string | null;
  stripe_connect_charges_enabled: boolean;
};

async function getCommunityPayout(communityId: string): Promise<CommunityPayout | null> {
  const rows = await db<CommunityPayout[]>`
    SELECT slug, stripe_connect_account_id, stripe_connect_charges_enabled
    FROM public.communities WHERE id = ${communityId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export type StartTierResult = { kind: 'checkout'; url: string } | { kind: 'switched'; tierId: string };

// Subscribes the member to a tier, or switches their existing subscription to a
// new tier (price swap with proration) — never creating a second subscription.
export async function startOrSwitchTier(
  communityId: string,
  tierId: string,
  userId: string,
  email: string,
  returnPath: string,
): Promise<StartTierResult> {
  const community = await getCommunityPayout(communityId);
  if (!community) throw new Error('[gild] community not found');
  const account = community.stripe_connect_account_id;
  if (!account || !community.stripe_connect_charges_enabled) {
    throw new Error('[gild] this community is not set up to accept payments yet');
  }

  const member = await getMemberBilling(communityId, userId);
  if (!member) throw new Error('[gild] join the community before subscribing to a tier');

  const tierRows = await db<{ stripe_price_id: string | null; is_active: boolean }[]>`
    SELECT stripe_price_id, is_active FROM public.membership_tiers
    WHERE id = ${tierId} AND community_id = ${communityId} LIMIT 1
  `;
  const tier = tierRows[0];
  if (!tier || !tier.is_active || !tier.stripe_price_id) {
    throw new Error('[gild] that tier is not available');
  }

  const metadata = { communityId, userId, tierId, kind: SUB_KIND };

  // Already subscribed → swap the price on the existing subscription.
  if (member.stripe_subscription_id) {
    let sub: Stripe.Subscription | null = null;
    try {
      sub = await stripe.subscriptions.retrieve(member.stripe_subscription_id, undefined, { stripeAccount: account });
    } catch {
      sub = null; // subscription gone — fall through to fresh checkout
    }
    if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
      if (member.tier_id === tierId) return { kind: 'switched', tierId }; // no-op, already on it
      const itemId = sub.items.data[0]?.id;
      if (!itemId) throw new Error('[gild] subscription has no item to switch');
      await stripe.subscriptions.update(
        member.stripe_subscription_id,
        {
          items: [{ id: itemId, price: tier.stripe_price_id }],
          proration_behavior: 'create_prorations',
          cancel_at_period_end: false,
          metadata,
        },
        { stripeAccount: account },
      );
      await db`
        UPDATE public.community_members
        SET tier_id = ${tierId}, tier_status = 'active', tier_current_period_end = NULL
        WHERE community_id = ${communityId} AND user_id = ${userId}
      `;
      return { kind: 'switched', tierId };
    }
  }

  // Fresh subscription via Checkout. Reuse the stored customer if we have one.
  const appUrl = await getAppUrl();
  const safePath = returnPath.startsWith('/') ? returnPath : `/c/${community.slug}`;
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
      ...(member.stripe_customer_id
        ? { customer: member.stripe_customer_id }
        : { customer_email: email }),
      success_url: `${appUrl}${safePath}?tier=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${safePath}?tier=cancelled`,
      // 0% application fee — omitted entirely, creator keeps 100%.
      subscription_data: { metadata },
      metadata,
    },
    { stripeAccount: account },
  );
  if (!session.url) throw new Error('[gild] could not create checkout session');
  return { kind: 'checkout', url: session.url };
}

// Confirms a completed Checkout on return from Stripe and grants the tier
// immediately — so unlock never depends on connect-webhook timing/config.
export async function confirmTierCheckout(
  communityId: string,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const account = (await getCommunityPayout(communityId))?.stripe_connect_account_id;
  if (!account) return false;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(
      sessionId,
      { expand: ['subscription'] },
      { stripeAccount: account },
    );
  } catch {
    return false;
  }

  const m = session.metadata ?? {};
  if (m.kind !== SUB_KIND || m.communityId !== communityId || m.userId !== userId || !m.tierId) {
    return false;
  }

  const sub = session.subscription;
  const status = sub && typeof sub !== 'string' ? sub.status : null;
  const subId = sub && typeof sub !== 'string' ? sub.id : null;
  const active = session.payment_status === 'paid' || status === 'active' || status === 'trialing';
  if (!active) return false;

  await db`
    UPDATE public.community_members
    SET tier_id = ${m.tierId},
        tier_status = ${status ?? 'active'},
        stripe_subscription_id = ${subId},
        stripe_customer_id = ${customerId(session.customer)},
        tier_current_period_end = NULL
    WHERE community_id = ${communityId} AND user_id = ${userId}
  `;
  return true;
}

// Cancels at period end — the member keeps access until the paid period runs
// out, after which gating lapses (period_end gate) even without a webhook.
export async function cancelMembership(
  communityId: string,
  userId: string,
): Promise<{ endsAt: string | null }> {
  const account = (await getCommunityPayout(communityId))?.stripe_connect_account_id;
  if (!account) throw new Error('[gild] community payouts not configured');

  const member = await getMemberBilling(communityId, userId);
  if (!member?.stripe_subscription_id) throw new Error('[gild] no active membership to cancel');

  const sub = await stripe.subscriptions.update(
    member.stripe_subscription_id,
    { cancel_at_period_end: true },
    { stripeAccount: account },
  );
  const endsAt = periodEndISO(sub);

  await db`
    UPDATE public.community_members
    SET tier_current_period_end = ${endsAt}
    WHERE community_id = ${communityId} AND user_id = ${userId}
  `;
  return { endsAt };
}

export interface MembershipState {
  tierId: string | null;
  tierName: string | null;
  status: string | null;
  active: boolean;
  cancelAt: string | null;
}

// The member's current tier state for a community (for the Membership page).
export async function getMembershipState(
  communityId: string,
  userId: string,
): Promise<MembershipState> {
  const rows = await db<
    { tier_id: string | null; name: string | null; tier_status: string | null; tier_current_period_end: string | null }[]
  >`
    SELECT cm.tier_id, mt.name, cm.tier_status, cm.tier_current_period_end
    FROM public.community_members cm
    LEFT JOIN public.membership_tiers mt ON mt.id = cm.tier_id
    WHERE cm.community_id = ${communityId} AND cm.user_id = ${userId}
    LIMIT 1
  `;
  const r = rows[0];
  const statusActive = r?.tier_status === 'active' || r?.tier_status === 'trialing';
  const notExpired =
    !r?.tier_current_period_end || new Date(r.tier_current_period_end).getTime() > Date.now();
  return {
    tierId: r?.tier_id ?? null,
    tierName: r?.name ?? null,
    status: r?.tier_status ?? null,
    active: Boolean(r && statusActive && notExpired && r.tier_id),
    cancelAt: r?.tier_current_period_end ?? null,
  };
}

// ─── Connect webhook handlers ───────────────────────────────────────────────

function tierMeta(sub: Stripe.Subscription): { communityId: string; userId: string; tierId: string } | null {
  const m = sub.metadata ?? {};
  if (m.kind !== SUB_KIND || !m.communityId || !m.userId || !m.tierId) return null;
  return { communityId: m.communityId, userId: m.userId, tierId: m.tierId };
}

export async function handleConnectSubscriptionUpsert(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const meta = tierMeta(sub);
  if (!meta) return;

  const active = sub.status === 'active' || sub.status === 'trialing';
  if (active) {
    // Period end only matters as a hard expiry once a cancellation is scheduled.
    const endsAt = sub.cancel_at_period_end ? periodEndISO(sub) : null;
    await db`
      UPDATE public.community_members
      SET tier_id = ${meta.tierId},
          tier_status = ${sub.status},
          stripe_subscription_id = ${sub.id},
          stripe_customer_id = ${customerId(sub.customer)},
          tier_current_period_end = ${endsAt}
      WHERE community_id = ${meta.communityId} AND user_id = ${meta.userId}
    `;
  } else {
    await db`
      UPDATE public.community_members
      SET tier_id = NULL,
          tier_status = ${sub.status}
      WHERE community_id = ${meta.communityId}
        AND user_id = ${meta.userId}
        AND stripe_subscription_id = ${sub.id}
    `;
  }
}

export async function handleConnectSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const meta = tierMeta(sub);
  if (!meta) return;

  await db`
    UPDATE public.community_members
    SET tier_id = NULL,
        tier_status = 'canceled',
        stripe_subscription_id = NULL,
        tier_current_period_end = NULL
    WHERE community_id = ${meta.communityId}
      AND user_id = ${meta.userId}
      AND stripe_subscription_id = ${sub.id}
  `;
}
