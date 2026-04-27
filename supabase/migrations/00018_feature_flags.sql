-- ============================================================================
-- Migration 00018 — Feature flags
-- Per-community feature flags with a global fallback. community_id IS NULL
-- means the row applies to every community as the default; a row with a
-- specific community_id overrides the global value for that community.
-- The application is responsible for the precedence (per-community first,
-- then global) — the schema only stores the entries.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  flag_name    text NOT NULL CHECK (char_length(flag_name) BETWEEN 1 AND 100),
  is_enabled   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_flags_community_flag_key UNIQUE (community_id, flag_name)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_community
  ON public.feature_flags (community_id)
  WHERE community_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feature_flags_global
  ON public.feature_flags (flag_name)
  WHERE community_id IS NULL;

CREATE OR REPLACE TRIGGER set_updated_at_feature_flags
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
