import 'server-only';

import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from './stripe';
import db from '../db';
import { env } from '../env';

// ─── Member tier subscriptions (Stripe Connect, direct charges) ─────────────
// Members subscribe to a community's tier; the charge lands on the creator's
// connected account with a 0% application fee. Webhooks arriving for connected
// accounts (event.account set) assign/clear community_members.tier_id.

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

// Creates a subscription Checkout Session on the creator's connected account.
// returnPath is where Stripe sends the member back (validated to a local path).
export async function createTierCheckout(
  communityId: string,
  tierId: string,
  userId: string,
  email: string,
  returnPath: string,
): Promise<{ url: string }> {
  const communityRows = await db<
    { slug: string; stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean }[]
  >`
    SELECT slug, stripe_connect_account_id, stripe_connect_charges_enabled
    FROM public.communities WHERE id = ${communityId} LIMIT 1
  `;
  const community = communityRows[0];
  if (!community) throw new Error('[gild] community not found');
  if (!community.stripe_connect_account_id || !community.stripe_connect_charges_enabled) {
    throw new Error('[gild] this community is not set up to accept payments yet');
  }

  // Must already be a member of the community to subscribe to a tier.
  const memberRows = await db<{ role: string }[]>`
    SELECT role FROM public.community_members
    WHERE community_id = ${communityId} AND user_id = ${userId} LIMIT 1
  `;
  if (!memberRows[0]) throw new Error('[gild] join the community before subscribing to a tier');

  const tierRows = await db<{ stripe_price_id: string | null; is_active: boolean }[]>`
    SELECT stripe_price_id, is_active FROM public.membership_tiers
    WHERE id = ${tierId} AND community_id = ${communityId} LIMIT 1
  `;
  const tier = tierRows[0];
  if (!tier || !tier.is_active || !tier.stripe_price_id) {
    throw new Error('[gild] that tier is not available');
  }

  const appUrl = await getAppUrl();
  const safePath = returnPath.startsWith('/') ? returnPath : `/c/${community.slug}`;
  const metadata = { communityId, userId, tierId, kind: SUB_KIND };

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}${safePath}?tier=success`,
      cancel_url: `${appUrl}${safePath}?tier=cancelled`,
      // 0% application fee — omitted entirely, creator keeps 100%.
      subscription_data: { metadata },
      metadata,
    },
    { stripeAccount: community.stripe_connect_account_id },
  );

  if (!session.url) throw new Error('[gild] could not create checkout session');
  return { url: session.url };
}

// ─── Connect webhook handlers ───────────────────────────────────────────────
// These run only for events where event.account is set (connected accounts).
// They are no-ops for any subscription that isn't one of ours (kind check),
// and are safe to replay (idempotent UPDATEs).

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
    // Grant (or keep) access at this tier.
    await db`
      UPDATE public.community_members
      SET tier_id = ${meta.tierId},
          tier_status = ${sub.status},
          stripe_subscription_id = ${sub.id}
      WHERE community_id = ${meta.communityId} AND user_id = ${meta.userId}
    `;
  } else {
    // Lapsed (past_due / unpaid / incomplete / paused) — revoke tier access but
    // record the status so the member can recover by paying.
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
