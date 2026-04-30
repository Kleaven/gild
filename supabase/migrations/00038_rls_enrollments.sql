-- ============================================================
-- Migration 00038: RLS policies — enrollments
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments FORCE ROW LEVEL SECURITY;

-- enrollments_select
-- Users can see their own enrollments.
-- Community admins can see enrollments for courses in their community (roster management).
-- Platform admins have full access.
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
CREATE POLICY "enrollments_select"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- enrollments_insert
-- Locked to platform_admin only — enroll_in_course RPC (SECURITY DEFINER)
-- is the only correct enrollment path and enforces membership and payment checks.
DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
CREATE POLICY "enrollments_insert"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- enrollments_update
-- Locked to platform_admin only — no direct enrollment update path exists.
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
CREATE POLICY "enrollments_update"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- enrollments_delete
-- Community admins can unenroll members from their courses.
-- Users can unenroll themselves. Platform admins have full access.
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;
CREATE POLICY "enrollments_delete"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (
    user_id = current_user_id()
    OR user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );
