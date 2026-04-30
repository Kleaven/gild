-- ============================================================
-- 07_negative_rls_write_violations.sql
-- Gate 1 Part B — negative RLS: write violations
-- ============================================================
BEGIN;
SELECT plan(7);

-- CONTENT OWNERSHIP:
-- 1. member_paid cannot update a post authored by owner in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SAVEPOINT sp_update_post;
UPDATE public.posts SET title = 'hacked' WHERE id = '00000000-0000-0000-0000-000000000050' AND author_id = pgtap_helpers.fixture('owner');
SELECT is(
  (SELECT title FROM public.posts WHERE id = '00000000-0000-0000-0000-000000000050'),
  'Welcome to Gild Public Demo',
  'member_paid cannot update a post authored by owner'
);
ROLLBACK TO sp_update_post;

-- 2. member_paid cannot delete a post authored by owner
SAVEPOINT sp_delete_post;
DELETE FROM public.posts WHERE id = '00000000-0000-0000-0000-000000000050';
SELECT is(
  (SELECT COUNT(*)::int FROM public.posts WHERE id = '00000000-0000-0000-0000-000000000050'),
  1,
  'member_paid cannot delete a post authored by owner'
);
ROLLBACK TO sp_delete_post;

-- ROLE ESCALATION:
-- 3. member_free cannot update own role in community_members
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SAVEPOINT sp_update_own_role;
UPDATE public.community_members SET role = 'admin'
WHERE user_id = pgtap_helpers.fixture('member_free') AND community_id = pgtap_helpers.fixture('community_public');
SELECT is(
  (SELECT role::text FROM public.community_members WHERE user_id = pgtap_helpers.fixture('member_free') AND community_id = pgtap_helpers.fixture('community_public')),
  'free_member',
  'member_free cannot update own role in community_members'
);
ROLLBACK TO sp_update_own_role;

-- 4. member_paid cannot update another member's role
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SAVEPOINT sp_update_other_role;
UPDATE public.community_members SET role = 'banned'
WHERE user_id = pgtap_helpers.fixture('member_free') AND community_id = pgtap_helpers.fixture('community_public');
SELECT is(
  (SELECT role::text FROM public.community_members WHERE user_id = pgtap_helpers.fixture('member_free') AND community_id = pgtap_helpers.fixture('community_public')),
  'free_member',
  'member_paid cannot update another member''s role'
);
ROLLBACK TO sp_update_other_role;

-- COMMUNITY OWNERSHIP:
-- 5. member_paid cannot update community_public (only owner can)
SAVEPOINT sp_update_comm;
UPDATE public.communities SET name = 'hacked' WHERE id = pgtap_helpers.fixture('community_public');
SELECT is(
  (SELECT name FROM public.communities WHERE id = pgtap_helpers.fixture('community_public')),
  'Gild Public Demo',
  'member_paid cannot update community_public'
);
ROLLBACK TO sp_update_comm;

-- 6. owner(000002) cannot update community of another owner
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SAVEPOINT sp_update_other_comm;
UPDATE public.communities SET name = 'hacked' WHERE id = '00000000-0000-0000-0000-000000000099';
SELECT is(
  (SELECT COUNT(*)::int FROM public.communities WHERE id = '00000000-0000-0000-0000-000000000099'),
  0,
  'owner cannot update community of another owner'
);
ROLLBACK TO sp_update_other_comm;

-- PLATFORM ADMIN TABLE:
-- 7. member_paid cannot select platform_admins table
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT is(
  (SELECT COUNT(*)::int FROM public.platform_admins),
  0,
  'member_paid cannot select platform_admins table'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
