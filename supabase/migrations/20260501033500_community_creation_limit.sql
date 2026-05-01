-- Migration: community creation limit logic
-- Ensures a user can only create a new community if their existing ones are in good standing.
-- This fulfills the Gate 2 "Wallet" requirement.

CREATE OR REPLACE FUNCTION public.create_community(
  p_name        text,
  p_slug        text,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_community_id uuid;
  v_user_id      uuid;
  v_existing_count int;
  v_latest_status text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  -- Wallet Logic: Check for community creation limit
  -- A user can create their FIRST community freely.
  -- To create an N+1 community, the most recent one must be 'active' or 'trialing'.
  SELECT count(*), 
         (SELECT subscription_status FROM public.communities 
          WHERE owner_id = v_user_id 
          ORDER BY created_at DESC LIMIT 1)
  INTO v_existing_count, v_latest_status
  FROM public.communities
  WHERE owner_id = v_user_id;

  IF v_existing_count > 0 AND v_latest_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION '[gild] wallet_inactive: community creation locked due to billing status on existing communities';
  END IF;

  INSERT INTO public.communities (name, slug, description, owner_id)
  VALUES (p_name, p_slug, p_description, v_user_id)
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
