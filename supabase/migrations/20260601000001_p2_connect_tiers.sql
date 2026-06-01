-- Phase 2a — Stripe Connect (creator payouts) + tier ↔ Stripe linkage
-- Standard Connect accounts with direct charges: members pay creators directly,
-- Gild takes a 0% application fee. Each community holds its connected account id
-- and a cached "charges enabled" flag refreshed from account.updated webhooks.

SET search_path = public, extensions;

-- ── Community payout account ────────────────────────────────────────────────
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false;

-- One Stripe account per community (nullable until onboarding starts).
CREATE UNIQUE INDEX IF NOT EXISTS communities_stripe_connect_account_id_key
  ON public.communities (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- ── Tier ↔ Stripe product ───────────────────────────────────────────────────
-- membership_tiers already has stripe_price_id; the Product lives on the
-- connected account too and we keep its id so price changes can re-use it.
ALTER TABLE public.membership_tiers
  ADD COLUMN IF NOT EXISTS stripe_product_id text;
