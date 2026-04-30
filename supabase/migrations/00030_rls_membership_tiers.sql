-- ============================================================
-- Migration 00030: RLS policies — membership_tiers
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers FORCE ROW LEVEL SECURITY;

-- membership_tiers_select_public
-- Any authenticated user can see tiers for non-private, non-deleted
-- communities — needed for join/upgrade pricing pages.
DROP POLICY IF EXISTS "membership_tiers_select_public" ON public.membership_tiers;
CREATE POLICY "membership_tiers_select_public"
  ON public.membership_tiers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- membership_tiers_select_member
DROP POLICY IF EXISTS "membership_tiers_select_member" ON public.membership_tiers;
CREATE POLICY "membership_tiers_select_member"
  ON public.membership_tiers
  FOR SELECT
  TO authenticated
  USING (is_community_member(community_id));

-- membership_tiers_insert
DROP POLICY IF EXISTS "membership_tiers_insert" ON public.membership_tiers;
CREATE POLICY "membership_tiers_insert"
  ON public.membership_tiers
  FOR INSERT
  TO authenticated
  WITH CHECK (is_community_owner(community_id) OR is_platform_admin());

-- membership_tiers_update
DROP POLICY IF EXISTS "membership_tiers_update" ON public.membership_tiers;
CREATE POLICY "membership_tiers_update"
  ON public.membership_tiers
  FOR UPDATE
  TO authenticated
  USING (is_community_owner(community_id) OR is_platform_admin())
  WITH CHECK (is_community_owner(community_id) OR is_platform_admin());

-- membership_tiers_delete
DROP POLICY IF EXISTS "membership_tiers_delete" ON public.membership_tiers;
CREATE POLICY "membership_tiers_delete"
  ON public.membership_tiers
  FOR DELETE
  TO authenticated
  USING (is_community_owner(community_id) OR is_platform_admin());
