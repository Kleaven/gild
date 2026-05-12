-- ============================================================================
-- Migration 20260510000006 — Update create_community RPC
-- Updates the signature to accept privacy, category, and theme hue.
-- ============================================================================

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.create_community(
  p_name        text,
  p_slug        text,
  p_description text DEFAULT NULL,
  p_is_private  boolean DEFAULT false,
  p_category    text DEFAULT NULL,
  p_theme_hue   integer DEFAULT 250
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_community_id uuid;
  v_user_id      uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  INSERT INTO public.communities (name, slug, description, owner_id, is_private, category, theme_hue)
  VALUES (p_name, p_slug, p_description, v_user_id, p_is_private, p_category, p_theme_hue)
  RETURNING id INTO v_community_id;

  -- Owner is automatically a member with role 'owner'.
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  -- Initialise member_count.
  UPDATE public.communities
  SET member_count = 1
  WHERE id = v_community_id;

  RETURN v_community_id;
END;
$$;
