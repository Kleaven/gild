-- ============================================================
-- Migration 00028: RLS policies — communities
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities FORCE ROW LEVEL SECURITY;

-- communities_select_public
DROP POLICY IF EXISTS "communities_select_public" ON public.communities;
CREATE POLICY "communities_select_public"
  ON public.communities
  FOR SELECT
  TO authenticated, anon
  USING (is_private = false AND deleted_at IS NULL);

-- communities_select_member
DROP POLICY IF EXISTS "communities_select_member" ON public.communities;
CREATE POLICY "communities_select_member"
  ON public.communities
  FOR SELECT
  TO authenticated
  USING (
    is_private = true
    AND deleted_at IS NULL
    AND is_community_member(id)
  );

-- communities_insert
-- Direct INSERT locked to platform_admin only — create_community RPC
-- (SECURITY DEFINER) is the real creation path.
DROP POLICY IF EXISTS "communities_insert" ON public.communities;
CREATE POLICY "communities_insert"
  ON public.communities
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- communities_update
DROP POLICY IF EXISTS "communities_update" ON public.communities;
CREATE POLICY "communities_update"
  ON public.communities
  FOR UPDATE
  TO authenticated
  USING (is_community_owner(id) OR is_platform_admin())
  WITH CHECK (is_community_owner(id) OR is_platform_admin());

-- communities_delete
DROP POLICY IF EXISTS "communities_delete" ON public.communities;
CREATE POLICY "communities_delete"
  ON public.communities
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
