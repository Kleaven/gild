-- ============================================================
-- Migration 00037: RLS policies — lessons
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons FORCE ROW LEVEL SECURITY;

-- lessons_select_public
DROP POLICY IF EXISTS "lessons_select_public" ON public.lessons;
CREATE POLICY "lessons_select_public"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses co ON co.id = m.course_id
      JOIN public.communities c ON c.id = co.community_id
      WHERE m.id = module_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- lessons_select_member
DROP POLICY IF EXISTS "lessons_select_member" ON public.lessons;
CREATE POLICY "lessons_select_member"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    is_community_member(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       WHERE m.id = module_id)
    )
  );

-- lessons_insert
DROP POLICY IF EXISTS "lessons_insert" ON public.lessons;
CREATE POLICY "lessons_insert"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       WHERE m.id = module_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- lessons_update
DROP POLICY IF EXISTS "lessons_update" ON public.lessons;
CREATE POLICY "lessons_update"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       WHERE m.id = module_id),
      'admin'
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       WHERE m.id = module_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- lessons_delete
DROP POLICY IF EXISTS "lessons_delete" ON public.lessons;
CREATE POLICY "lessons_delete"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       WHERE m.id = module_id),
      'admin'
    )
    OR is_platform_admin()
  );
