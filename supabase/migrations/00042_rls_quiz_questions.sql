-- ============================================================
-- Migration 00042: RLS policies — quiz_questions
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions FORCE ROW LEVEL SECURITY;

-- quiz_questions_select_public
DROP POLICY IF EXISTS "quiz_questions_select_public" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select_public"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      JOIN public.lessons l ON l.id = q.lesson_id
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.courses co ON co.id = m.course_id
      JOIN public.communities c ON c.id = co.community_id
      WHERE q.id = quiz_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- quiz_questions_select_member
DROP POLICY IF EXISTS "quiz_questions_select_member" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select_member"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (
    is_community_member(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id)
    )
  );

-- quiz_questions_insert
DROP POLICY IF EXISTS "quiz_questions_insert" ON public.quiz_questions;
CREATE POLICY "quiz_questions_insert"
  ON public.quiz_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- quiz_questions_update
DROP POLICY IF EXISTS "quiz_questions_update" ON public.quiz_questions;
CREATE POLICY "quiz_questions_update"
  ON public.quiz_questions
  FOR UPDATE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'admin'
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- quiz_questions_delete
DROP POLICY IF EXISTS "quiz_questions_delete" ON public.quiz_questions;
CREATE POLICY "quiz_questions_delete"
  ON public.quiz_questions
  FOR DELETE
  TO authenticated
  USING (
    user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'admin'
    )
    OR is_platform_admin()
  );
