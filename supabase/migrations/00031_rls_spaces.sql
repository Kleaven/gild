-- ============================================================
-- Migration 00031: RLS policies — spaces
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces FORCE ROW LEVEL SECURITY;

-- spaces_select
-- Membership-gated: a user must be a non-banned member of the host
-- community to see any space. Public-community discovery happens via
-- the communities table; spaces are revealed only after joining.
DROP POLICY IF EXISTS "spaces_select" ON public.spaces;
CREATE POLICY "spaces_select"
  ON public.spaces
  FOR SELECT
  TO authenticated
  USING (is_community_member(community_id) OR is_platform_admin());

-- spaces_insert
DROP POLICY IF EXISTS "spaces_insert" ON public.spaces;
CREATE POLICY "spaces_insert"
  ON public.spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- spaces_update
DROP POLICY IF EXISTS "spaces_update" ON public.spaces;
CREATE POLICY "spaces_update"
  ON public.spaces
  FOR UPDATE
  TO authenticated
  USING (user_has_min_role(community_id, 'admin') OR is_platform_admin())
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- spaces_delete
DROP POLICY IF EXISTS "spaces_delete" ON public.spaces;
CREATE POLICY "spaces_delete"
  ON public.spaces
  FOR DELETE
  TO authenticated
  USING (is_community_owner(community_id) OR is_platform_admin());
