-- ============================================================================
-- Migration 00010 — Courses, modules, lessons
-- Three-level course structure. Video is embed-only in v1: lessons store a
-- video_url string (YouTube/Vimeo). No Cloudflare Stream, no media-table
-- reference for video. drip_days controls time-gated availability after
-- enrollment (NULL = available immediately).
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- courses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  space_id     uuid NOT NULL REFERENCES public.spaces (id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  text NULL CHECK (char_length(description) <= 2000),
  is_published boolean NOT NULL DEFAULT false,
  position     smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_community
  ON public.courses (community_id);

CREATE INDEX IF NOT EXISTS idx_courses_space
  ON public.courses (space_id);

CREATE OR REPLACE TRIGGER set_updated_at_courses
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- modules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  title      text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  position   smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_course
  ON public.modules (course_id);

CREATE OR REPLACE TRIGGER set_updated_at_modules
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- lessons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    uuid NOT NULL REFERENCES public.modules (id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body         text NULL,           -- markdown content
  video_url    text NULL,           -- embedded YouTube/Vimeo URL, NULL if no video
  position     smallint NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  drip_days    integer NULL CHECK (drip_days >= 0), -- NULL = immediate, N = N days after enrollment
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module
  ON public.lessons (module_id);

CREATE OR REPLACE TRIGGER set_updated_at_lessons
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
