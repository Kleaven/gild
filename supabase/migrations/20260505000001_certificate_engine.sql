-- ============================================================================
-- Migration 20260505000001 — Certificate engine
-- Adds verification_token to certificates for public verification URLs.
-- Adds issue_certificate SECURITY DEFINER RPC — direct INSERT is locked to
-- platform_admin by RLS (same pattern as enroll_in_course, complete_lesson).
-- Adds get_certificate_by_token SECURITY DEFINER RPC for unauthenticated
-- public verification pages.
-- ============================================================================

SET search_path = public, extensions;

-- Add public verification token to certificates (unique, auto-generated)
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS verification_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_verification_token
  ON public.certificates (verification_token);

-- ----------------------------------------------------------------------------
-- issue_certificate — SECURITY DEFINER
-- Idempotent: repeated calls return the existing certificate id.
-- Verifies ownership, checks all published lessons complete, INSERTs cert,
-- stamps enrollments.completed_at if not already set.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_certificate(
  p_enrollment_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id           uuid;
  v_enrollment        public.enrollments;
  v_total_lessons     integer;
  v_completed_lessons integer;
  v_cert_id           uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] enrollment not found';
  END IF;

  -- Ownership check — IS DISTINCT FROM guards against NULL on either side
  IF v_enrollment.user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION '[gild] enrollment not found';
  END IF;

  -- Idempotency: return existing certificate without error
  SELECT id INTO v_cert_id
  FROM public.certificates
  WHERE user_id = v_user_id AND course_id = v_enrollment.course_id;

  IF v_cert_id IS NOT NULL THEN
    RETURN v_cert_id;
  END IF;

  -- Count published lessons — empty courses cannot be certified
  SELECT COUNT(*) INTO v_total_lessons
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = v_enrollment.course_id
    AND l.is_published = true;

  IF v_total_lessons = 0 THEN
    RAISE EXCEPTION '[gild] course has no published lessons';
  END IF;

  -- Count completed lessons for this enrollment
  SELECT COUNT(*) INTO v_completed_lessons
  FROM public.lesson_progress lp
  JOIN public.lessons l ON l.id = lp.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id      = v_enrollment.course_id
    AND lp.enrollment_id = p_enrollment_id
    AND lp.completed_at IS NOT NULL;

  IF v_completed_lessons < v_total_lessons THEN
    RAISE EXCEPTION '[gild] course not yet complete';
  END IF;

  INSERT INTO public.certificates (user_id, course_id, enrollment_id)
  VALUES (v_user_id, v_enrollment.course_id, p_enrollment_id)
  RETURNING id INTO v_cert_id;

  -- Stamp enrollment completion if not already set
  UPDATE public.enrollments
  SET completed_at = now()
  WHERE id = p_enrollment_id AND completed_at IS NULL;

  RETURN v_cert_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- get_certificate_by_token — SECURITY DEFINER, callable by unauthenticated
-- Returns only public-safe display fields; never exposes user_id or IDs.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_certificate_by_token(
  p_token uuid
)
RETURNS TABLE (
  issued_at        timestamptz,
  certificate_url  text,
  recipient_name   text,
  course_title     text,
  community_name   text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.issued_at,
    c.certificate_url,
    p.display_name  AS recipient_name,
    co.title        AS course_title,
    cm.name         AS community_name
  FROM public.certificates c
  JOIN public.profiles    p  ON p.id  = c.user_id
  JOIN public.courses     co ON co.id = c.course_id
  JOIN public.communities cm ON cm.id = co.community_id
  WHERE c.verification_token = p_token
    AND cm.deleted_at IS NULL;
END;
$$;
