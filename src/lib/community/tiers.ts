import 'server-only';

import { stripe } from '../billing/stripe';
import db from '../db';

// ─── Membership tiers ───────────────────────────────────────────────────────
// A community's paid tiers. Each tier mirrors a Stripe Product + recurring
// Price created ON THE CONNECTED ACCOUNT (direct charges), so the price id is
// only valid in that account's context. Tiers are ranked by `position`
// (0 = lowest); module paywalls unlock for that tier or higher.

export interface Tier {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  priceMonthUsd: number;
  position: number;
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
}

type TierRow = {
  id: string;
  community_id: string;
  name: string;
  description: string | null;
  price_month_usd: number;
  position: number;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
};

function mapTier(r: TierRow): Tier {
  return {
    id: r.id,
    communityId: r.community_id,
    name: r.name,
    description: r.description,
    priceMonthUsd: r.price_month_usd,
    position: r.position,
    isActive: r.is_active,
    stripePriceId: r.stripe_price_id,
    stripeProductId: r.stripe_product_id,
  };
}

export async function listTiers(communityId: string, includeInactive = false): Promise<Tier[]> {
  const rows = includeInactive
    ? await db<TierRow[]>`
        SELECT id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
        FROM public.membership_tiers
        WHERE community_id = ${communityId}
        ORDER BY position ASC
      `
    : await db<TierRow[]>`
        SELECT id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
        FROM public.membership_tiers
        WHERE community_id = ${communityId} AND is_active = true
        ORDER BY position ASC
      `;
  return rows.map(mapTier);
}

type OwnerCommunity = {
  owner_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_charges_enabled: boolean;
  name: string;
};

async function assertOwner(communityId: string, userId: string): Promise<OwnerCommunity> {
  const rows = await db<OwnerCommunity[]>`
    SELECT owner_id, stripe_connect_account_id, stripe_connect_charges_enabled, name
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const c = rows[0];
  if (!c) throw new Error('[gild] community not found');
  if (c.owner_id !== userId) throw new Error('[gild] only the community owner can manage tiers');
  return c;
}

export interface TierInput {
  name: string;
  description: string | null;
  priceMonthUsd: number;
}

function validateInput(input: TierInput): void {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 50) throw new Error('[gild] tier name must be 1–50 characters');
  if (input.description && input.description.length > 500) {
    throw new Error('[gild] tier description must be 500 characters or fewer');
  }
  if (!Number.isInteger(input.priceMonthUsd) || input.priceMonthUsd < 1 || input.priceMonthUsd > 100000) {
    throw new Error('[gild] tier price must be a whole USD amount between 1 and 100000');
  }
}

export async function createTier(
  communityId: string,
  userId: string,
  input: TierInput,
): Promise<Tier> {
  validateInput(input);
  const c = await assertOwner(communityId, userId);
  if (!c.stripe_connect_account_id) {
    throw new Error('[gild] connect a payout account before creating paid tiers');
  }

  const stripeAccount = c.stripe_connect_account_id;
  const name = input.name.trim();
  const description = input.description?.trim() || null;

  // Product + recurring monthly Price on the creator's connected account.
  const product = await stripe.products.create(
    { name, ...(description ? { description } : {}) },
    { stripeAccount },
  );
  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: 'usd',
      unit_amount: input.priceMonthUsd * 100,
      recurring: { interval: 'month' },
    },
    { stripeAccount },
  );

  const posRows = await db<{ max: number | null }[]>`
    SELECT MAX(position) AS max FROM public.membership_tiers WHERE community_id = ${communityId}
  `;
  const position = (posRows[0]?.max ?? -1) + 1;

  const inserted = await db<TierRow[]>`
    INSERT INTO public.membership_tiers
      (community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id)
    VALUES
      (${communityId}, ${name}, ${description}, ${input.priceMonthUsd}, ${position}, true, ${price.id}, ${product.id})
    RETURNING id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
  `;
  return mapTier(inserted[0]!);
}

export async function updateTier(
  tierId: string,
  communityId: string,
  userId: string,
  input: TierInput,
): Promise<Tier> {
  validateInput(input);
  const c = await assertOwner(communityId, userId);
  const stripeAccount = c.stripe_connect_account_id;

  const existingRows = await db<TierRow[]>`
    SELECT id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
    FROM public.membership_tiers
    WHERE id = ${tierId} AND community_id = ${communityId}
    LIMIT 1
  `;
  const existing = existingRows[0];
  if (!existing) throw new Error('[gild] tier not found');

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  let priceId = existing.stripe_price_id;

  if (stripeAccount) {
    // Keep the Stripe product name/description in sync.
    if (existing.stripe_product_id) {
      await stripe.products.update(
        existing.stripe_product_id,
        { name, description: description ?? undefined },
        { stripeAccount },
      );
    }
    // Stripe Prices are immutable — on a price change, archive the old one and
    // mint a new recurring price. Existing subscriptions keep their old price.
    if (input.priceMonthUsd !== existing.price_month_usd && existing.stripe_product_id) {
      if (existing.stripe_price_id) {
        await stripe.prices.update(existing.stripe_price_id, { active: false }, { stripeAccount });
      }
      const newPrice = await stripe.prices.create(
        {
          product: existing.stripe_product_id,
          currency: 'usd',
          unit_amount: input.priceMonthUsd * 100,
          recurring: { interval: 'month' },
        },
        { stripeAccount },
      );
      priceId = newPrice.id;
    }
  }

  const updated = await db<TierRow[]>`
    UPDATE public.membership_tiers
    SET name = ${name},
        description = ${description},
        price_month_usd = ${input.priceMonthUsd},
        stripe_price_id = ${priceId}
    WHERE id = ${tierId} AND community_id = ${communityId}
    RETURNING id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
  `;
  return mapTier(updated[0]!);
}

// Soft-deactivate: never hard-delete a tier members may be subscribed to.
// Archives the Stripe product/price and flips is_active so it stops appearing
// in pickers and checkout while leaving existing subscriptions intact.
export async function deactivateTier(
  tierId: string,
  communityId: string,
  userId: string,
): Promise<void> {
  const c = await assertOwner(communityId, userId);
  const stripeAccount = c.stripe_connect_account_id;

  const rows = await db<TierRow[]>`
    SELECT id, community_id, name, description, price_month_usd, position, is_active, stripe_price_id, stripe_product_id
    FROM public.membership_tiers
    WHERE id = ${tierId} AND community_id = ${communityId}
    LIMIT 1
  `;
  const tier = rows[0];
  if (!tier) throw new Error('[gild] tier not found');

  if (stripeAccount) {
    if (tier.stripe_price_id) {
      await stripe.prices.update(tier.stripe_price_id, { active: false }, { stripeAccount });
    }
    if (tier.stripe_product_id) {
      await stripe.products.update(tier.stripe_product_id, { active: false }, { stripeAccount });
    }
  }

  await db`
    UPDATE public.membership_tiers
    SET is_active = false
    WHERE id = ${tierId} AND community_id = ${communityId}
  `;
}
