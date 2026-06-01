-- Phase 2b — member tier subscriptions on community_members
-- A member holds at most one active tier per community. tier_id already exists
-- (FK → membership_tiers, ON DELETE SET NULL); add the Stripe subscription link
-- and status so webhooks can assign/clear access.

SET search_path = public, extensions;

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS tier_status text,
  ADD COLUMN IF NOT EXISTS tier_current_period_end timestamptz;

-- One Stripe subscription maps to one membership row.
CREATE UNIQUE INDEX IF NOT EXISTS community_members_stripe_subscription_id_key
  ON public.community_members (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
