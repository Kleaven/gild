-- ============================================================================
-- Migration 00026 — Enrollment RPCs
-- enroll_in_course is idempotent — repeated calls return the existing
-- enrollment id rather than failing on the (user, course) UNIQUE.
-- complete_lesson upserts a lesson_progress row and, when every published
-- lesson in the course is now complete, stamps enrollments.completed_at.
--
-- A3 fix from the Step 12 review (approved):
--   complete_lesson now (1) raises immediately when auth.uid() IS NULL,
--   and (2) compares enrolment ownership with IS DISTINCT FROM. The
--   original draft used `!= auth.uid()`, which would let an unauth caller
--   slip past the ownership check on three-valued logic.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. enroll_in_course — idempotent. Requires the course to be published
--    and the caller to be a non-banned member of the host community.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_in_course(
  p_course_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id       uuid;
  v_course        public.courses;
  v_enrollment_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] course not found';
  END IF;

  IF NOT v_course.is_published THEN
    RAISE EXCEPTION '[gild] course is not published';
  END IF;

  IF NOT public.is_community_member(v_course.community_id) THEN
    RAISE EXCEPTION '[gild] must be a community member to enroll';
  END IF;

  -- Idempotent — return existing enrollment if already enrolled.
  SELECT id INTO v_enrollment_id
  FROM public.enrollments
  WHERE user_id = v_user_id AND course_id = p_course_id;

  IF v_enrollment_id IS NOT NULL THEN
    RETURN v_enrollment_id;
  END IF;

  INSERT INTO public.enrollments (user_id, course_id)
  VALUES (v_user_id, p_course_id)
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. complete_lesson — upsert lesson_progress and roll up to enrolment
--    completion when every published lesson in the course is done.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_lesson(
  p_enrollment_id uuid,
  p_lesson_id     uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_enrollment        public.enrollments;
  v_total_lessons     integer;
  v_completed_lessons integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.enrollments WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] enrollment not found';
  END IF;

  -- Only the enrolled user can mark progress. IS DISTINCT FROM ensures
  -- the check still fires if either side ever turns up NULL.
  IF v_enrollment.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION '[gild] cannot mark progress for another user';
  END IF;

  -- Upsert lesson_progress.
  INSERT INTO public.lesson_progress (enrollment_id, lesson_id, completed_at)
  VALUES (p_enrollment_id, p_lesson_id, now())
  ON CONFLICT (enrollment_id, lesson_id)
  DO UPDATE SET completed_at = now();

  -- Total published lessons in the course.
  SELECT COUNT(*) INTO v_total_lessons
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = v_enrollment.course_id
    AND l.is_published = true;

  -- Completed lessons for this enrolment.
  SELECT COUNT(*) INTO v_completed_lessons
  FROM public.lesson_progress lp
  JOIN public.lessons l ON l.id = lp.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id        = v_enrollment.course_id
    AND lp.enrollment_id   = p_enrollment_id
    AND lp.completed_at IS NOT NULL;

  IF v_total_lessons > 0 AND v_completed_lessons >= v_total_lessons THEN
    UPDATE public.enrollments
    SET completed_at = now()
    WHERE id = p_enrollment_id AND completed_at IS NULL;
  END IF;
END;
$$;
