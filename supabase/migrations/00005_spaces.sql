-- ============================================================================
-- Migration 00005 — Spaces
-- Sections within a community, like channels. Posts (00006) live inside a
-- space. min_role gates access using the member_role enum from 00004.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- space_type enum — DO-block guard, same pattern as 00004.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'space_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.space_type AS ENUM (
      'feed',
      'course',
      'events',
      'members',
      'chat'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.spaces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  name         text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  slug         text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  description  text NULL,
  type         public.space_type NOT NULL DEFAULT 'feed',
  position     smallint NOT NULL DEFAULT 0,
  is_private   boolean NOT NULL DEFAULT false,
  min_role     public.member_role NOT NULL DEFAULT 'free_member',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz NULL,
  CONSTRAINT spaces_community_slug_key UNIQUE (community_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_spaces_community
  ON public.spaces (community_id);

CREATE INDEX IF NOT EXISTS idx_spaces_community_position
  ON public.spaces (community_id, position);

CREATE OR REPLACE TRIGGER set_updated_at_spaces
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
