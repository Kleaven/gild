-- ============================================================
-- Migration 00041: RLS policies — quizzes
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes FORCE ROW LEVEL SECURITY;

-- quizzes_select_public
DROP POLICY IF EXISTS "quizzes_select_public" ON public.quizzes;
CREATE POLICY "quizzes_select_public"
  ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.courses co ON co.id = m.course_id
      JOIN public.communities c ON c.id = co.community_id
      WHERE l.id = lesson_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- quizzes_select_member
DROP POLICY IF EXISTS "quizzes_select_member" ON public.quizzes;
CREATE POLICY "quizzes_select_member"
  ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    is_community_member(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id)
    )
  );

-- quizzes_insert
DROP POLICY IF EXISTS "quizzes_insert" ON public.quizzes;
CREATE POLICY "quizzes_insert"
  ON public.quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- quizzes_update
DROP POLICY IF EXISTS "quizzes_update" ON public.quizzes;
CREATE POLICY "quizzes_update"
  ON public.quizzes
  FOR UPDATE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id),
      'admin'
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- quizzes_delete
DROP POLICY IF EXISTS "quizzes_delete" ON public.quizzes;
CREATE POLICY "quizzes_delete"
  ON public.quizzes
  FOR DELETE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id),
      'admin'
    )
    OR is_platform_admin()
  );
