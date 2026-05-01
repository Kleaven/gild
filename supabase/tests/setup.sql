CREATE EXTENSION IF NOT EXISTS pgtap SCHEMA public;
ALTER EXTENSION pgtap SET SCHEMA public;



-- ============================================================
-- 00_helpers.sql — pgTAP harness: auth helpers + fixture table
-- Run first (alphabetical order). Not wrapped in a transaction
-- so that schema, functions, and fixtures persist for subsequent
-- test files.
-- ============================================================

-- ============================================================
-- pgtap_helpers schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS pgtap_helpers;

-- ============================================================
-- Auth-switching helpers
-- set_config(..., true) makes the setting local to the transaction,
-- resetting automatically when the transaction ends.
-- ============================================================

CREATE OR REPLACE FUNCTION pgtap_helpers.set_auth(
  user_id uuid,
  role    text DEFAULT 'authenticated'
)
RETURNS void LANGUAGE sql AS $$
  SELECT
    set_config(
      'request.jwt.claims',
      json_build_object('sub', user_id::text, 'role', role)::text,
      true   -- is_local: resets at transaction end
    ),
    set_config('role', role, true);
$$;

CREATE OR REPLACE FUNCTION pgtap_helpers.set_anon()
RETURNS void LANGUAGE sql AS $$
  SELECT
    set_config('request.jwt.claims', '{}', true),
    set_config('role', 'anon', true);
$$;

CREATE OR REPLACE FUNCTION pgtap_helpers.clear_auth()
RETURNS void LANGUAGE sql AS $$
  SELECT
    set_config('request.jwt.claims', '{}', true),
    set_config('role', 'anon', true);
$$;

-- ============================================================
-- Fixture table — UUIDs must match supabase/seed.sql exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS pgtap_helpers.fixtures (
  name text PRIMARY KEY,
  id   uuid NOT NULL
);

INSERT INTO pgtap_helpers.fixtures (name, id) VALUES
  ('platform_admin',    '00000000-0000-0000-0000-000000000001'),
  ('owner',             '00000000-0000-0000-0000-000000000002'),
  ('member_paid',       '00000000-0000-0000-0000-000000000003'),
  ('member_free',       '00000000-0000-0000-0000-000000000004'),
  ('member_banned',     '00000000-0000-0000-0000-000000000005'),
  ('community_public',  '00000000-0000-0000-0000-000000000010'),
  ('community_private', '00000000-0000-0000-0000-000000000011')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION pgtap_helpers.fixture(name text)
RETURNS uuid LANGUAGE sql AS $$
  SELECT id FROM pgtap_helpers.fixtures WHERE name = $1;
$$;

-- ============================================================
-- Grants — all Supabase roles must be able to call helper
-- functions even after set_auth switches role to 'authenticated'
-- or 'anon'. Without this, lives_ok() calls fail with permission
-- denied when the test session's role has been switched.
-- ============================================================
GRANT USAGE ON SCHEMA pgtap_helpers TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgtap_helpers TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA pgtap_helpers TO authenticated, anon, service_role;
GRANT SELECT ON pgtap_helpers.fixtures TO authenticated, anon, service_role;
