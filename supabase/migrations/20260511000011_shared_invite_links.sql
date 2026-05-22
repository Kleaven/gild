-- Migration: Shared Join Links
-- Adds support for multi-use invite links for communities.
--
-- Note: pgcrypto's gen_random_bytes is installed in the `extensions` schema
-- on Supabase. Schema-qualify the call so this migration is portable across
-- session search_path states (matters for fresh-bootstrap pushes that don't
-- inherit search_path from earlier migrations).

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.community_invite_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  creator_id   uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(12), 'hex'),
  max_uses     integer NULL, -- NULL for unlimited
  uses         integer NOT NULL DEFAULT 0,
  expires_at   timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_invite_links_token
  ON public.community_invite_links (token);

-- Update join_community to accept an optional invite token
CREATE OR REPLACE FUNCTION public.join_community(
  p_community_id uuid,
  p_invite_token text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id        uuid;
  v_existing_role  public.member_role;
  v_is_private     boolean;
  v_invite_valid   boolean := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT role INTO v_existing_role
  FROM public.community_members
  WHERE community_id = p_community_id AND user_id = v_user_id;

  IF v_existing_role = 'banned' THEN
    RAISE EXCEPTION '[gild] you are banned from this community';
  END IF;

  IF v_existing_role IS NOT NULL THEN
    RAISE EXCEPTION '[gild] already a member';
  END IF;

  SELECT is_private INTO v_is_private
  FROM public.communities
  WHERE id = p_community_id;

  -- Verify invite token if provided
  IF p_invite_token IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.community_invite_links
      WHERE community_id = p_community_id 
      AND token = p_invite_token
      AND (max_uses IS NULL OR uses < max_uses)
      AND (expires_at IS NULL OR expires_at > now())
    ) THEN
      v_invite_valid := true;
      
      -- Increment use count
      UPDATE public.community_invite_links
      SET uses = uses + 1
      WHERE community_id = p_community_id AND token = p_invite_token;
    END IF;
  END IF;

  -- Block joining private communities directly without valid invite
  IF v_is_private = true AND v_invite_valid = false THEN
    RAISE EXCEPTION '[gild] this community is private and requires an invitation';
  END IF;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (p_community_id, v_user_id, 'free_member');

  UPDATE public.communities
  SET member_count = member_count + 1
  WHERE id = p_community_id;
END;
$$;
