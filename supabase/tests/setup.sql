-- 1. Ensure Standard Supabase Roles Exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END $$;

-- 2. Setup pgTAP in Public
CREATE EXTENSION IF NOT EXISTS pgtap SCHEMA public;

-- 3. Setup pgtap_helpers schema and utilities
CREATE SCHEMA IF NOT EXISTS pgtap_helpers;

-- Auth-switching helpers
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

-- Fixture table — UUIDs must match supabase/seed.sql exactly
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

-- 4. Grant GOD-MODE permissions to PUBLIC for testing
-- This ensures the CI runner, regardless of its role, can see the helpers.
GRANT USAGE ON SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA pgtap_helpers TO PUBLIC;

-- 5. Ensure the database connection itself is open
GRANT CONNECT ON DATABASE postgres TO PUBLIC;
