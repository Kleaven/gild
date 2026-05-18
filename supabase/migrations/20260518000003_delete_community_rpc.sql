-- ============================================================================
-- Migration 20260518000003 — delete_community SECURITY DEFINER RPC
--
-- Why this exists:
--   Soft-deleting a community via direct supabase.from('communities').update()
--   fails RLS even when the caller is the legitimate owner. The mechanism:
--
--     1. communities_update WITH CHECK passes (is_community_owner(id) is true)
--     2. BUT both SELECT policies on communities filter `deleted_at IS NULL`:
--          - communities_select_public:  is_private = false AND deleted_at IS NULL
--          - communities_select_member:  is_private = true  AND deleted_at IS NULL AND is_community_member(id)
--     3. The moment we set deleted_at = NOW(), the new row state cannot pass
--        either SELECT policy. PostgREST's UPDATE then reports the generic
--        "new row violates row-level security policy" because the post-UPDATE
--        row is no longer visible to the caller.
--
--   This is a fundamental conflict — soft-delete-via-direct-UPDATE plus
--   "hide-deleted-rows-in-SELECT" cannot coexist. Routing the delete through
--   a SECURITY DEFINER RPC bypasses RLS on the actual UPDATE while keeping
--   the authorization check explicit inside the function.
--
-- Authorization model:
--   - Caller MUST be the row's owner_id (NOT just role='owner' in
--     community_members — those are separate tracks). The check matches
--     RLS communities_update USING exactly, so future RLS changes stay
--     consistent.
--   - Platform admins can also delete (kept for parity with RLS).
--   - Already-deleted communities are treated as "not found" — surface
--     the same error to avoid leaking which IDs were valid.
-- ============================================================================

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.delete_community(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Verify the caller owns this community AND it isn't already deleted.
  -- Matches the RLS policy: is_community_owner(id) OR is_platform_admin().
  IF NOT EXISTS (
    SELECT 1
    FROM public.communities
    WHERE id = p_community_id
      AND deleted_at IS NULL
      AND (owner_id = v_uid OR public.is_platform_admin())
  ) THEN
    RAISE EXCEPTION 'insufficient_permissions' USING ERRCODE = 'P0001';
  END IF;

  -- Soft delete. RLS doesn't intercept this UPDATE because we're running
  -- as the function owner (SECURITY DEFINER).
  UPDATE public.communities
     SET deleted_at = now()
   WHERE id = p_community_id;
END;
$$;

-- Lock down the function: only signed-in users can call it. The function
-- itself enforces ownership.
REVOKE ALL ON FUNCTION public.delete_community(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_community(uuid) TO authenticated;
