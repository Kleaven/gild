-- ============================================================================
-- Migration 00004 — Community members
-- Join table between profiles and communities. Carries the role enum from
-- CLAUDE.md's permission hierarchy. Banned members keep their row so the
-- ban survives re-joins. Tier reference is nullable; ON DELETE SET NULL
-- because a tier may be deactivated/deleted independent of memberships.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- member_role enum (Postgres has no native CREATE TYPE IF NOT EXISTS, so we
-- guard via a one-shot DO block — the only DO block in this migration set
-- besides the equivalent guards in 00005 and 00007).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'member_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.member_role AS ENUM (
      'owner',
      'admin',
      'moderator',
      'tier2_member',
      'tier1_member',
      'free_member',
      'banned'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.community_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role         public.member_role NOT NULL DEFAULT 'free_member',
  tier_id      uuid NULL REFERENCES public.membership_tiers (id) ON DELETE SET NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_members_community_user_key
    UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_community
  ON public.community_members (community_id);

CREATE INDEX IF NOT EXISTS idx_community_members_user
  ON public.community_members (user_id);

CREATE INDEX IF NOT EXISTS idx_community_members_role
  ON public.community_members (community_id, role);

CREATE OR REPLACE TRIGGER set_updated_at_community_members
  BEFORE UPDATE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
