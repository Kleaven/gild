-- ============================================================
-- Migration 00035: RLS policies — courses
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;

-- courses_select_public
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
CREATE POLICY "courses_select_public"
  ON public.courses
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

-- courses_select_member
DROP POLICY IF EXISTS "courses_select_member" ON public.courses;
CREATE POLICY "courses_select_member"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (is_community_member(community_id));

-- courses_insert
-- No SECURITY DEFINER RPC for course CRUD — direct DML with admin gate is correct.
DROP POLICY IF EXISTS "courses_insert" ON public.courses;
CREATE POLICY "courses_insert"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- courses_update
DROP POLICY IF EXISTS "courses_update" ON public.courses;
CREATE POLICY "courses_update"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (user_has_min_role(community_id, 'admin') OR is_platform_admin())
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- courses_delete
DROP POLICY IF EXISTS "courses_delete" ON public.courses;
CREATE POLICY "courses_delete"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (is_community_owner(community_id) OR is_platform_admin());
