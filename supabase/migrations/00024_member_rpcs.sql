-- ============================================================================
-- Migration 00024 — Member RPCs
-- Join, leave, and role-management. join_community keeps member_count
-- accurate; leave_community refuses to remove the owner (transfer first);
-- update_member_role enforces the rule that admins can demote/move other
-- non-admin roles around but only the owner can mint new admins, and that
-- changing the owner role is reserved to transfer_community_ownership.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. join_community
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_community(
  p_community_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id        uuid;
  v_existing_role  public.member_role;
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

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (p_community_id, v_user_id, 'free_member');

  UPDATE public.communities
  SET member_count = member_count + 1
  WHERE id = p_community_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. leave_community — owner is forbidden; they must transfer first.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_community(
  p_community_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_role    public.member_role;
BEGIN
  v_user_id := auth.uid();

  SELECT role INTO v_role
  FROM public.community_members
  WHERE community_id = p_community_id AND user_id = v_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION '[gild] not a member of this community';
  END IF;

  IF v_role = 'owner' THEN
    RAISE EXCEPTION '[gild] owner cannot leave — transfer ownership first';
  END IF;

  DELETE FROM public.community_members
  WHERE community_id = p_community_id AND user_id = v_user_id;

  UPDATE public.communities
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = p_community_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. update_member_role — admin or owner only. Cannot mint owners
--    (transfer_community_ownership handles that). Admins cannot promote
--    other members to admin; only the owner can.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_community_id uuid,
  p_user_id      uuid,
  p_new_role     public.member_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Only owner or admin can change roles.
  IF NOT public.user_has_min_role(p_community_id, 'admin') THEN
    RAISE EXCEPTION '[gild] insufficient permissions to change roles';
  END IF;

  -- Cannot assign owner role via this function.
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION '[gild] use transfer_community_ownership to change owner';
  END IF;

  -- Admin cannot promote to admin (only owner can).
  IF public.current_user_role(p_community_id) = 'admin'
     AND p_new_role = 'admin' THEN
    RAISE EXCEPTION '[gild] admins cannot promote other admins';
  END IF;

  UPDATE public.community_members
  SET role = p_new_role
  WHERE community_id = p_community_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] member not found';
  END IF;
END;
$$;
