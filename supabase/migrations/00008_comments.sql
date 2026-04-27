-- ============================================================================
-- Migration 00008 — Comments
-- Threaded replies to posts. The schema permits arbitrary nesting via
-- parent_id; the application enforces the one-level-of-nesting rule
-- (parent.parent_id IS NULL) at write time. parent_id ON DELETE CASCADE
-- means deleting a parent comment removes its direct replies.
-- author_id is nullable so a profile deletion (cascading from auth.users
-- via 00001) leaves the comment standing as a [deleted] tombstone.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  author_id    uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  parent_id    uuid NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  like_count   integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  is_flagged   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post
  ON public.comments (post_id);

CREATE INDEX IF NOT EXISTS idx_comments_author
  ON public.comments (author_id);

CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON public.comments (parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON public.comments (post_id, created_at ASC)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
