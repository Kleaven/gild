-- Migration: Add profile existence guard to create_community RPC
-- Root cause: users who sign in via Google OAuth with an email prefix
-- containing characters invalid for the username CHECK constraint (e.g. '.')
-- fail to get a profile created in the OAuth callback. The callback previously
-- swallowed the insert error silently, leaving the user with a valid auth
-- session but no public.profiles row. The subsequent INSERT into communities
-- (owner_id REFERENCES profiles(id)) produced a foreign_key_violation
-- (SQLSTATE 23503) which PostgREST maps to HTTP 409.
--
-- Fix in callback: username is no longer derived for OAuth users (it is
-- nullable; users set it later). This migration adds a defensive guard so
-- any existing profileless users get a clear 400 instead of a cryptic 409.

SET search_path = public, extensions;

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
  v_community_id   uuid;
  v_user_id        uuid;
  v_existing_count int;
  v_latest_status  text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  -- Guard: profile must exist before any FK reference is attempted.
  -- Catches users who authenticated via OAuth but whose profile insert
  -- failed in the callback (e.g. invalid username format).
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION '[gild] profile_required: complete profile setup before creating a community';
  END IF;

  -- Wallet logic: first community is always allowed; subsequent communities
  -- require the most-recent community to be active or trialing.
  SELECT count(*),
         (SELECT subscription_status
          FROM public.communities
          WHERE owner_id = v_user_id
          ORDER BY created_at DESC
          LIMIT 1)
  INTO v_existing_count, v_latest_status
  FROM public.communities
  WHERE owner_id = v_user_id;

  IF v_existing_count > 0 AND v_latest_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION '[gild] wallet_inactive: community creation locked due to billing status on existing communities';
  END IF;

  INSERT INTO public.communities (name, slug, description, owner_id)
  VALUES (p_name, p_slug, p_description, v_user_id)
  RETURNING id INTO v_community_id;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  UPDATE public.communities
  SET member_count = 1
  WHERE id = v_community_id;

  RETURN v_community_id;
END;
$$;
