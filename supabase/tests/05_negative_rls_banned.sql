-- ============================================================
-- 05_negative_rls_banned.sql
-- Gate 1 Part B — negative RLS: banned member access
-- ============================================================
BEGIN;
SELECT plan(6);

-- Tests for banned user access. member_banned(000005) is in community_public with role=banned.
-- is_community_member() excludes banned — verify this blocks all content reads.

SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_banned'));

-- 1. banned user cannot select posts in community_public
SELECT is(
  (SELECT COUNT(*)::int FROM public.posts WHERE community_id = pgtap_helpers.fixture('community_public')),
  0,
  'banned: cannot select posts in community_public'
);

-- 2. banned user cannot select spaces in community_public
SELECT is(
  (SELECT COUNT(*)::int FROM public.spaces WHERE community_id = pgtap_helpers.fixture('community_public')),
  0,
  'banned: cannot select spaces in community_public'
);

-- 3. banned user cannot select courses in community_public
SELECT is(
  (SELECT COUNT(*)::int FROM public.courses WHERE community_id = pgtap_helpers.fixture('community_public')),
  0,
  'banned: cannot select courses in community_public'
);

-- 4. banned user cannot select community_members in community_public
SELECT is(
  (SELECT COUNT(*)::int FROM public.community_members WHERE community_id = pgtap_helpers.fixture('community_public')),
  0,
  'banned: cannot select community_members in community_public'
);

-- 5. banned user cannot select membership_tiers in community_public
SELECT is(
  (SELECT COUNT(*)::int FROM public.membership_tiers WHERE community_id = pgtap_helpers.fixture('community_public')),
  0,
  'banned: cannot select membership_tiers in community_public'
);

-- 6. banned user cannot select community_private (not a member + banned)
SELECT is(
  (SELECT COUNT(*)::int FROM public.communities WHERE id = pgtap_helpers.fixture('community_private')),
  0,
  'banned: cannot select community_private'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
