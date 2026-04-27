-- ============================================================================
-- Migration 00012 — Quizzes
-- v1 is multiple-choice only. One quiz per lesson maximum (enforced by the
-- UNIQUE on quizzes.lesson_id). quiz_questions.options is a jsonb array of
-- {id, text}; correct_id matches one of those ids. quiz_attempts rows are
-- immutable historical records — no updated_at, no soft-delete.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- quizzes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  uuid NOT NULL UNIQUE REFERENCES public.lessons (id) ON DELETE CASCADE,
  title      text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  pass_score smallint NOT NULL DEFAULT 80 CHECK (pass_score BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER set_updated_at_quizzes
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- quiz_questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id    uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  options    jsonb NOT NULL CHECK (jsonb_array_length(options) BETWEEN 2 AND 6),
  correct_id text NOT NULL,
  position   smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz
  ON public.quiz_questions (quiz_id);

CREATE OR REPLACE TRIGGER set_updated_at_quiz_questions
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- quiz_attempts (immutable, no updated_at)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
  answers       jsonb NOT NULL,
  score         smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed        boolean NOT NULL DEFAULT false,
  attempted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user
  ON public.quiz_attempts (quiz_id, user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment
  ON public.quiz_attempts (enrollment_id);
