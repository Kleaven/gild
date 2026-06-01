-- Phase 2d — member billing hardening
-- Store the member's Stripe customer (on the connected account) so we can reuse
-- it for subscription swaps and avoid creating duplicate customers. The existing
-- tier_current_period_end is now used as a hard access expiry that we set ONLY
-- when a member cancels at period end (NULL means "active, no scheduled end").

SET search_path = public, extensions;

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
