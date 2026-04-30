-- ============================================================
-- Migration 00055: Standard Supabase table permission grants
-- The managed Supabase service applies these automatically on
-- project creation, but they were absent from this project.
-- RLS policies on all tables remain in force; these grants only
-- allow the roles to attempt access — RLS then filters rows.
-- ============================================================
SET search_path = public, extensions;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO authenticated;

GRANT SELECT
  ON ALL TABLES IN SCHEMA public
  TO anon;

GRANT ALL
  ON ALL TABLES IN SCHEMA public
  TO service_role;

GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public
  TO authenticated, anon, service_role;

-- Ensure future tables created by postgres get the same grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon, service_role;
