-- ============================================================
-- 06_negative_rls_nonmember.sql
-- Gate 1 Part B — negative RLS: non-member & anon access
-- ============================================================
BEGIN;
SELECT plan(10);

-- NON-MEMBER (member_free -> community_private)
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));

-- 1. member_free cannot select community_private row
SELECT is(
  (SELECT COUNT(*)::int FROM public.communities WHERE id = pgtap_helpers.fixture('community_private')),
  0,
  'non-member: cannot select community_private row'
);

-- 2. member_free cannot select posts in community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.posts WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'non-member: cannot select posts in community_private'
);

-- 3. member_free cannot select spaces in community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.spaces WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'non-member: cannot select spaces in community_private'
);

-- 4. member_free cannot select courses in community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.courses WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'non-member: cannot select courses in community_private'
);

-- 5. member_free cannot select community_members of community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.community_members WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'non-member: cannot select community_members of community_private'
);

-- 6. member_free cannot insert a post into community_private space
SELECT throws_ok(
  $$ INSERT INTO public.posts (community_id, space_id, author_id, title, body)
     VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000004', 'hacked', 'hacked') $$,
  'new row violates row-level security policy for table "posts"',
  'non-member: cannot insert a post into community_private space'
);


-- UNAUTHENTICATED (set_anon)
SELECT pgtap_helpers.set_anon();

-- 7. anon cannot select community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.communities WHERE id = pgtap_helpers.fixture('community_private')),
  0,
  'anon: cannot select community_private'
);

-- 8. anon cannot select posts in community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.posts WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'anon: cannot select posts in community_private'
);

-- 9. anon cannot select spaces in community_private
SELECT is(
  (SELECT COUNT(*)::int FROM public.spaces WHERE community_id = pgtap_helpers.fixture('community_private')),
  0,
  'anon: cannot select spaces in community_private'
);

-- 10. anon CAN select community_public (positive check)
SELECT is(
  (SELECT COUNT(*)::int FROM public.communities WHERE id = pgtap_helpers.fixture('community_public')),
  1,
  'anon: CAN select community_public'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
