-- ============================================================================
-- Migration 00009 — Votes
-- Single-table likes for both posts and comments, discriminated by
-- target_type. target_id is intentionally not a typed FK because it
-- references either posts or comments depending on target_type;
-- application code enforces referential integrity. Votes are immutable —
-- no updated_at, no deleted_at, no soft-delete. Toggling off is a row
-- delete.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- vote_target_type enum — DO-block guard, same pattern as 00004/00005/00007.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'vote_target_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.vote_target_type AS ENUM (
      'post',
      'comment'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  target_type  public.vote_target_type NOT NULL,
  target_id    uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT votes_user_target_key UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_target
  ON public.votes (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_votes_user
  ON public.votes (user_id);
