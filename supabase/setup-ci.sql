-- 1. Reset Schema & Ownership
DROP SCHEMA IF EXISTS pgtap_helpers CASCADE;
CREATE SCHEMA pgtap_helpers;
ALTER SCHEMA pgtap_helpers OWNER TO postgres;

-- 2. Ensure Standard Supabase Roles Exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END $$;

-- 3. Restore Helper Functions
CREATE OR REPLACE FUNCTION pgtap_helpers.set_auth(user_id uuid)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'SET request.jwt.claims = %L',
    json_build_object('sub', user_id, 'role', 'authenticated')::text
  );
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pgtap_helpers.clear_auth()
RETURNS void AS $$
BEGIN
  RESET request.jwt.claims;
  RESET ROLE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pgtap_helpers.fixture(fixture_name text)
RETURNS uuid AS $$
BEGIN
  RETURN CASE fixture_name
    WHEN 'platform_admin'    THEN '00000000-0000-0000-0000-000000000001'::uuid
    WHEN 'owner'             THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN 'member_paid'       THEN '00000000-0000-0000-0000-000000000003'::uuid
    WHEN 'member_free'       THEN '00000000-0000-0000-0000-000000000004'::uuid
    WHEN 'member_banned'     THEN '00000000-0000-0000-0000-000000000005'::uuid
    WHEN 'community_public'  THEN '00000000-0000-0000-0000-000000000010'::uuid
    WHEN 'community_private' THEN '00000000-0000-0000-0000-000000000011'::uuid
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pgtap_helpers.set_anon()
RETURNS void AS $$
BEGIN
  RESET request.jwt.claims;
  SET LOCAL ROLE anon;
END;
$$ LANGUAGE plpgsql;

-- 4. God-Mode Grants
GRANT USAGE ON SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pgtap_helpers TO PUBLIC;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA pgtap_helpers TO PUBLIC;
