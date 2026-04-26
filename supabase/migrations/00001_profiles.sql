-- ============================================================================
-- Migration 00001 — Profiles
-- Public mirror of auth.users. One row per authenticated user.
-- Also defines public.set_updated_at(), the shared trigger function reused
-- by every later table that needs auto-maintained updated_at. plpgsql is
-- intentionally scoped to that single function; no other plpgsql in this
-- file. Pure SQL elsewhere.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- Shared updated_at trigger function. Reused across migrations 00002–00006.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name  text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 50),
  avatar_url    text NULL,
  bio           text NULL CHECK (char_length(bio) <= 500),
  username      text UNIQUE NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Partial index for case-sensitive username lookups; excludes NULLs so the
-- index is smaller than the implicit unique index on the column.
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- updated_at maintenance.
CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
