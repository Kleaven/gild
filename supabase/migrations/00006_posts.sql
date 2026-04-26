-- ============================================================================
-- Migration 00006 — Posts
-- User-generated content; the primary feed unit. author_id is nullable so a
-- profile deletion (which cascades from auth.users via 00001) becomes a
-- tombstone — the post survives with NULL author and the UI renders
-- [deleted]. like_count and comment_count are denormalised counters
-- maintained by application code in later steps.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  space_id      uuid NOT NULL REFERENCES public.spaces (id) ON DELETE CASCADE,
  author_id     uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  title         text NULL CHECK (char_length(title) <= 300),
  body          text NOT NULL CHECK (char_length(body) >= 1),
  is_pinned     boolean NOT NULL DEFAULT false,
  is_locked     boolean NOT NULL DEFAULT false,
  like_count    integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_community
  ON public.posts (community_id);

CREATE INDEX IF NOT EXISTS idx_posts_space
  ON public.posts (space_id);

CREATE INDEX IF NOT EXISTS idx_posts_author
  ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS idx_posts_community_created
  ON public.posts (community_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_pinned
  ON public.posts (community_id, is_pinned)
  WHERE is_pinned = true AND deleted_at IS NULL;

CREATE OR REPLACE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
