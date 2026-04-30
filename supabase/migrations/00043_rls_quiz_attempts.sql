-- ============================================================
-- Migration 00043: RLS policies — quiz_attempts
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts FORCE ROW LEVEL SECURITY;

-- quiz_attempts_select
-- Users see their own attempts. Community admins see attempts for quizzes
-- in their community. Platform admins have full access.
DROP POLICY IF EXISTS "quiz_attempts_select" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_select"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- quiz_attempts_insert
-- Any non-banned community member can submit a quiz attempt.
-- No SECURITY DEFINER RPC for quiz attempts — direct DML is correct.
DROP POLICY IF EXISTS "quiz_attempts_insert" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_insert"
  ON public.quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    current_user_id() IS NOT NULL
    AND user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       JOIN public.quizzes q ON q.lesson_id = l.id
       WHERE q.id = quiz_id),
      'free_member'
    )
  );

-- quiz_attempts_update
-- Locked to platform_admin only — attempts are immutable once submitted.
DROP POLICY IF EXISTS "quiz_attempts_update" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_update"
  ON public.quiz_attempts
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- quiz_attempts_delete
DROP POLICY IF EXISTS "quiz_attempts_delete" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_delete"
  ON public.quiz_attempts
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
