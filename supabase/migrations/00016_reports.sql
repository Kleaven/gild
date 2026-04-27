-- ============================================================================
-- Migration 00016 — Reports
-- Content moderation: members report posts or comments to community
-- moderators. target_id follows the same polymorphic pattern as votes
-- (00009) — no typed FK, application enforces referential integrity.
-- reporter_id and resolved_by are nullable + ON DELETE SET NULL so the
-- report record outlives the people who created or resolved it.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- report_target_type enum
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'report_target_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.report_target_type AS ENUM (
      'post',
      'comment'
    );
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- report_status enum
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'report_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.report_status AS ENUM (
      'pending',
      'resolved_removed',
      'resolved_dismissed'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  reporter_id  uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  target_type  public.report_target_type NOT NULL,
  target_id    uuid NOT NULL,
  reason       text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status       public.report_status NOT NULL DEFAULT 'pending',
  resolved_by  uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  resolved_at  timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_community
  ON public.reports (community_id);

CREATE INDEX IF NOT EXISTS idx_reports_community_pending
  ON public.reports (community_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_target
  ON public.reports (target_type, target_id);

CREATE OR REPLACE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
