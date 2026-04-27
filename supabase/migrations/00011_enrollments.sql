-- ============================================================================
-- Migration 00011 — Enrollments and lesson progress
-- enrollments = one row per (user, course). lesson_progress = one row per
-- (enrollment, lesson) marking when each lesson was completed.
-- enrollments.completed_at is set by application code when every lesson in
-- the course has a non-NULL lesson_progress.completed_at.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id    uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_user_course_key UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user
  ON public.enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course
  ON public.enrollments (course_id);

CREATE OR REPLACE TRIGGER set_updated_at_enrollments
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
  lesson_id     uuid NOT NULL REFERENCES public.lessons (id) ON DELETE CASCADE,
  completed_at  timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_enrollment_lesson_key UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON public.lesson_progress (enrollment_id);

CREATE OR REPLACE TRIGGER set_updated_at_lesson_progress
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
