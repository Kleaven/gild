-- ============================================================================
-- Migration 00013 — Certificates
-- Issued when a user completes a course and passes every required quiz.
-- Immutable once written: no updated_at, no soft-delete. enrollment_id is
-- carried alongside (user_id, course_id) so a certificate can be traced
-- back to the specific enrolment that earned it.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.certificates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  enrollment_id   uuid NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  certificate_url text NULL, -- generated PDF URL in Supabase Storage; NULL until generated
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificates_user_course_key UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user
  ON public.certificates (user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_course
  ON public.certificates (course_id);
