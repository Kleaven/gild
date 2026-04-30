-- ============================================================
-- Migration 00036: RLS policies — modules
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules FORCE ROW LEVEL SECURITY;

-- modules_select_public
DROP POLICY IF EXISTS "modules_select_public" ON public.modules;
CREATE POLICY "modules_select_public"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses co
      JOIN public.communities c ON c.id = co.community_id
      WHERE co.id = course_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- modules_select_member
DROP POLICY IF EXISTS "modules_select_member" ON public.modules;
CREATE POLICY "modules_select_member"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (
    is_community_member(
      (SELECT community_id FROM public.courses WHERE id = course_id)
    )
  );

-- modules_insert
DROP POLICY IF EXISTS "modules_insert" ON public.modules;
CREATE POLICY "modules_insert"
  ON public.modules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- modules_update
DROP POLICY IF EXISTS "modules_update" ON public.modules;
CREATE POLICY "modules_update"
  ON public.modules
  FOR UPDATE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- modules_delete
DROP POLICY IF EXISTS "modules_delete" ON public.modules;
CREATE POLICY "modules_delete"
  ON public.modules
  FOR DELETE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );
