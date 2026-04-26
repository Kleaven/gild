-- ============================================================================
-- Migration 00007 — Media
-- Tracks uploaded files attached to posts or profiles. Rows are immutable
-- after creation: no updated_at, no deleted_at. Deletion of a media row is
-- expected to happen alongside removal of the underlying Supabase Storage
-- object (handled by application code, not the database).
-- uploader_id is nullable so a profile deletion (which cascades from
-- auth.users via 00001) leaves orphan-but-attributed media in place rather
-- than blocking the cascade.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- media_type enum — DO-block guard, same pattern as 00004 and 00005.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'media_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.media_type AS ENUM (
      'image',
      'video',
      'file'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id  uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  post_id      uuid NULL REFERENCES public.posts (id) ON DELETE SET NULL,
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  storage_path text NULL, -- NULL for embedded video (YouTube/Vimeo). Populated for image and file uploads.
  public_url   text NULL,
  type         public.media_type NOT NULL,
  size_bytes   bigint NOT NULL CHECK (size_bytes > 0),
  mime_type    text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_post
  ON public.media (post_id)
  WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_uploader
  ON public.media (uploader_id);

CREATE INDEX IF NOT EXISTS idx_media_community
  ON public.media (community_id);
