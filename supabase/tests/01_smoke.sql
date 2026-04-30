-- ============================================================
-- 01_smoke.sql — minimal smoke tests confirming harness works
-- ============================================================
BEGIN;
SELECT plan(5);

-- 1. pgTAP loads
SELECT pass('pgTAP loaded');

-- 2. Helper schema exists
SELECT has_schema('pgtap_helpers');

-- 3. Fixture function resolves correctly
SELECT ok(
  pgtap_helpers.fixture('owner') = '00000000-0000-0000-0000-000000000002'::uuid,
  'fixture: owner UUID resolves correctly'
);

-- 4. set_auth does not throw
SELECT lives_ok(
  $$ SELECT pgtap_helpers.set_auth('00000000-0000-0000-0000-000000000002'::uuid) $$,
  'set_auth executes without error'
);

-- 5. clear_auth does not throw
SELECT lives_ok(
  $$ SELECT pgtap_helpers.clear_auth() $$,
  'clear_auth executes without error'
);

SELECT * FROM finish();
ROLLBACK;
