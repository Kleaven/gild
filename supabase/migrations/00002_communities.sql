-- ============================================================================
-- Migration 00002 — Communities
-- Tenancy unit. One row per community = one tenant. Owner is a profile;
-- ON DELETE RESTRICT prevents accidental owner removal while a community
-- still exists (use a soft-delete on communities first).
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.communities (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text NOT NULL UNIQUE
                            CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  name                   text NOT NULL
                            CHECK (char_length(name) BETWEEN 3 AND 100),
  description            text NULL
                            CHECK (char_length(description) <= 1000),
  owner_id               uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  plan                   text NOT NULL DEFAULT 'starter'
                            CHECK (plan IN ('starter', 'pro')),
  stripe_customer_id     text UNIQUE NULL,
  stripe_subscription_id text UNIQUE NULL,
  subscription_status    text NOT NULL DEFAULT 'trialing'
                            CHECK (subscription_status IN (
                              'trialing', 'active', 'past_due',
                              'canceled', 'unpaid', 'incomplete'
                            )),
  trial_ends_at          timestamptz NULL,
  member_count           integer NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  logo_url               text NULL,
  banner_url             text NULL,
  is_private             boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_communities_owner_id
  ON public.communities (owner_id);

CREATE INDEX IF NOT EXISTS idx_communities_slug
  ON public.communities (slug);

CREATE INDEX IF NOT EXISTS idx_communities_stripe_customer
  ON public.communities (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE OR REPLACE TRIGGER set_updated_at_communities
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
