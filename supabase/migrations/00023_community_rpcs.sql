-- ============================================================================
-- Migration 00023 — Community RPCs
-- Application-callable, SECURITY DEFINER. Centralises ownership and tenancy
-- write paths so the application never INSERTs into communities or
-- community_members directly. Each function pins search_path to defeat the
-- DEFINER-search-path-hijack attack class.
--
-- Deviation from the original spec for Step 12 (B1 fix, approved):
--   transfer_community_ownership now validates p_new_owner_id directly
--   against community_members. The original draft called
--   public.is_community_member(p_community_id), which checks the caller —
--   always true for the owner — and so did not enforce the documented
--   "new owner must already be a member" rule.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. create_community — creates the row, auto-memberships the caller as
--    'owner', and primes member_count = 1.
-- ----------------------------------------------------------------------------
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
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

-- ----------------------------------------------------------------------------
-- 2. transfer_community_ownership — only callable by the current owner.
--    Demotes the current owner to admin, promotes the new owner, and
--    rewrites communities.owner_id atomically. The new owner must already
--    be a non-banned member of the community (B1 fix).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_community_ownership(
  p_community_id uuid,
  p_new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF NOT public.is_community_owner(p_community_id) THEN
    RAISE EXCEPTION '[gild] only the owner can transfer ownership';
  END IF;

  -- New owner must already be a non-banned member of the community.
  IF NOT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id      = p_new_owner_id
      AND role <> 'banned'
  ) THEN
    RAISE EXCEPTION '[gild] new owner must be an existing non-banned member';
  END IF;

  -- Demote current owner to admin.
  UPDATE public.community_members
  SET role = 'admin'
  WHERE community_id = p_community_id AND user_id = v_user_id;

  -- Promote new owner.
  UPDATE public.community_members
  SET role = 'owner'
  WHERE community_id = p_community_id AND user_id = p_new_owner_id;

  -- Update communities.owner_id.
  UPDATE public.communities
  SET owner_id = p_new_owner_id
  WHERE id = p_community_id;
END;
$$;
