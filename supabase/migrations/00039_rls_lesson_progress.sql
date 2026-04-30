-- ============================================================
-- Migration 00039: RLS policies — lesson_progress
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress FORCE ROW LEVEL SECURITY;

-- lesson_progress_select
-- lesson_progress has no user_id column; user ownership is resolved via
-- enrollment_id → enrollments.user_id.
-- Users see their own progress. Community admins see progress for their
-- community's lessons. Platform admins have full access.
DROP POLICY IF EXISTS "lesson_progress_select" ON public.lesson_progress;
CREATE POLICY "lesson_progress_select"
  ON public.lesson_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND e.user_id = current_user_id()
    )
    OR user_has_min_role(
      (SELECT co.community_id FROM public.courses co
       JOIN public.modules m ON m.course_id = co.id
       JOIN public.lessons l ON l.module_id = m.id
       WHERE l.id = lesson_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- lesson_progress_insert
-- Locked to platform_admin only — complete_lesson RPC (SECURITY DEFINER)
-- is the only correct path and handles the ON CONFLICT upsert.
DROP POLICY IF EXISTS "lesson_progress_insert" ON public.lesson_progress;
CREATE POLICY "lesson_progress_insert"
  ON public.lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- lesson_progress_update
-- Locked to platform_admin only — complete_lesson RPC owns this mutation.
DROP POLICY IF EXISTS "lesson_progress_update" ON public.lesson_progress;
CREATE POLICY "lesson_progress_update"
  ON public.lesson_progress
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- lesson_progress_delete
DROP POLICY IF EXISTS "lesson_progress_delete" ON public.lesson_progress;
CREATE POLICY "lesson_progress_delete"
  ON public.lesson_progress
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
