-- ============================================================================
-- Migration 00003 — Membership tiers
-- Paid tiers within a community (tier_1, tier_2 in the permission hierarchy).
-- Each community defines its own tier names, prices, and Stripe price IDs.
-- price_month_usd is stored in cents.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  name            text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  description     text NULL CHECK (char_length(description) <= 500),
  price_month_usd integer NOT NULL CHECK (price_month_usd >= 0),
  stripe_price_id text UNIQUE NULL,
  position        smallint NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_tiers_community_position_key
    UNIQUE (community_id, position)
);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_community
  ON public.membership_tiers (community_id);

CREATE OR REPLACE TRIGGER set_updated_at_membership_tiers
  BEFORE UPDATE ON public.membership_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
