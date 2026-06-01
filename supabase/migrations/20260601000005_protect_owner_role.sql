-- Harden update_member_role: an admin must not be able to demote/ban the
-- community OWNER, nor manage other ADMINs. Previously the function blocked
-- assigning 'owner' and admins promoting to 'admin', but nothing protected the
-- owner (or a peer admin) as the TARGET — a rogue admin could ban the owner.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.update_member_role(
  p_community_id uuid,
  p_user_id uuid,
  p_new_role member_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_caller_role member_role;
  v_target_role member_role;
BEGIN
  -- Only owner or admin can change roles.
  IF NOT public.user_has_min_role(p_community_id, 'admin') THEN
    RAISE EXCEPTION '[gild] insufficient permissions to change roles';
  END IF;

  -- Cannot assign owner role via this function.
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION '[gild] use transfer_community_ownership to change owner';
  END IF;

  -- Never modify the community owner's membership via this path.
  IF EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = p_community_id AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION '[gild] cannot change the role of the community owner';
  END IF;

  v_caller_role := public.current_user_role(p_community_id);
  SELECT role INTO v_target_role
  FROM public.community_members
  WHERE community_id = p_community_id AND user_id = p_user_id;

  -- Admins may not create or touch other admins — only the owner can.
  IF v_caller_role = 'admin' AND (p_new_role = 'admin' OR v_target_role = 'admin') THEN
    RAISE EXCEPTION '[gild] admins cannot manage other admins';
  END IF;

  UPDATE public.community_members
  SET role = p_new_role
  WHERE community_id = p_community_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] member not found';
  END IF;
END;
$function$;
