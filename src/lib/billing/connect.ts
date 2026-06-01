import 'server-only';

import { headers } from 'next/headers';
import { stripe } from './stripe';
import db from '../db';
import { env } from '../env';

// ─── Stripe Connect (creator payouts) ──────────────────────────────────────
// Standard accounts + direct charges: members pay the creator's connected
// account directly, Gild applies a 0% application fee. This module owns the
// account lifecycle (create → onboard → status refresh). Member checkout and
// webhook tier assignment live in subscription/webhook modules.

async function getAppUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    // Outside a request (build/cron) — fall back to env.
  }
  return env.NEXT_PUBLIC_APP_URL;
}

export interface ConnectStatus {
  accountId: string | null;
  chargesEnabled: boolean;
}

type CommunityConnectRow = {
  id: string;
  slug: string;
  owner_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_charges_enabled: boolean;
};

async function getCommunityConnectRow(communityId: string): Promise<CommunityConnectRow | null> {
  const rows = await db<CommunityConnectRow[]>`
    SELECT id, slug, owner_id, stripe_connect_account_id, stripe_connect_charges_enabled
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getConnectStatus(communityId: string): Promise<ConnectStatus> {
  const c = await getCommunityConnectRow(communityId);
  if (!c) throw new Error('[gild] community not found');
  return {
    accountId: c.stripe_connect_account_id,
    chargesEnabled: c.stripe_connect_charges_enabled,
  };
}

// Creates the connected account on first call, persists its id, and returns a
// fresh onboarding Account Link. Owner-only.
export async function startConnectOnboarding(
  communityId: string,
  ownerUserId: string,
): Promise<{ url: string }> {
  const c = await getCommunityConnectRow(communityId);
  if (!c) throw new Error('[gild] community not found');
  if (c.owner_id !== ownerUserId) {
    throw new Error('[gild] only the community owner can connect a payout account');
  }

  let accountId = c.stripe_connect_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      metadata: { communityId },
    });
    accountId = account.id;
    await db`
      UPDATE public.communities
      SET stripe_connect_account_id = ${accountId}
      WHERE id = ${communityId}
    `;
  }

  const appUrl = await getAppUrl();
  const base = `${appUrl}/c/${c.slug}/settings/monetization`;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}?connect=refresh`,
    return_url: `${base}?connect=return`,
    type: 'account_onboarding',
  });
  return { url: link.url };
}

// Pulls live account state from Stripe and caches charges_enabled. Called on
// return from onboarding and as a fallback to the account.updated webhook.
export async function refreshConnectStatus(communityId: string): Promise<ConnectStatus> {
  const c = await getCommunityConnectRow(communityId);
  if (!c) throw new Error('[gild] community not found');
  if (!c.stripe_connect_account_id) return { accountId: null, chargesEnabled: false };

  const account = await stripe.accounts.retrieve(c.stripe_connect_account_id);
  const chargesEnabled = account.charges_enabled === true;
  if (chargesEnabled !== c.stripe_connect_charges_enabled) {
    await db`
      UPDATE public.communities
      SET stripe_connect_charges_enabled = ${chargesEnabled}
      WHERE id = ${communityId}
    `;
  }
  return { accountId: c.stripe_connect_account_id, chargesEnabled };
}
