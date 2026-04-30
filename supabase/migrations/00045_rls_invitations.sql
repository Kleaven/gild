-- ============================================================
-- Migration 00045: RLS policies — invitations
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;

-- invitations_select_public
DROP POLICY IF EXISTS "invitations_select_public" ON public.invitations;
CREATE POLICY "invitations_select_public"
  ON public.invitations
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

-- invitations_select_member
DROP POLICY IF EXISTS "invitations_select_member" ON public.invitations;
CREATE POLICY "invitations_select_member"
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (is_community_member(community_id));

-- invitations_insert
DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
CREATE POLICY "invitations_insert"
  ON public.invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- invitations_update
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
CREATE POLICY "invitations_update"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (user_has_min_role(community_id, 'admin') OR is_platform_admin())
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- invitations_delete
DROP POLICY IF EXISTS "invitations_delete" ON public.invitations;
CREATE POLICY "invitations_delete"
  ON public.invitations
  FOR DELETE
  TO authenticated
  USING (user_has_min_role(community_id, 'admin') OR is_platform_admin());
