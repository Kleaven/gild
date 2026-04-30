-- ============================================================
-- 03_positive_rls_content.sql
-- Gate 1 Part A — positive RLS: spaces, posts, courses, modules, lessons
-- ============================================================
BEGIN;
SELECT plan(14);

-- ============================================================
-- SPACES
-- policy: spaces_select USING (is_community_member(community_id) OR is_platform_admin())
-- Must be a non-banned member to see spaces, even for public communities.
-- community_public (…0010) has 2 spaces: …0040 (feed), …0042 (course)
-- community_private (…0011) has 2 spaces: …0041 (feed), …0043 (course)
-- ============================================================

-- 1. owner can select spaces in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.spaces
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'owner can select 2 spaces in community_public'
);

-- 2. member_paid can select spaces in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.spaces
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_paid can select 2 spaces in community_public'
);

-- 3. member_paid can select spaces in community_private
SELECT ok(
  (SELECT COUNT(*) FROM public.spaces
   WHERE community_id = pgtap_helpers.fixture('community_private')) = 2,
  'member_paid can select 2 spaces in community_private'
);

-- 4. member_free can select spaces in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SELECT ok(
  (SELECT COUNT(*) FROM public.spaces
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_free can select 2 spaces in community_public'
);

-- ============================================================
-- POSTS
-- policy: posts_select USING (is_community_member(community_id_via_spaces) OR is_platform_admin())
-- community_id resolved via: (SELECT community_id FROM public.spaces WHERE id = space_id)
-- community_public has 2 posts (…0050, …0051) in space …0040
-- community_private has 1 post (…0052) in space …0041
-- ============================================================

-- 5. owner can select posts in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.posts
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'owner can select 2 posts in community_public'
);

-- 6. member_paid can select posts in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.posts
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_paid can select 2 posts in community_public'
);

-- 7. member_paid can select posts in community_private
SELECT ok(
  (SELECT COUNT(*) FROM public.posts
   WHERE community_id = pgtap_helpers.fixture('community_private')) = 1,
  'member_paid can select 1 post in community_private'
);

-- 8. member_free can select posts in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SELECT ok(
  (SELECT COUNT(*) FROM public.posts
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_free can select 2 posts in community_public'
);

-- 9. owner can insert a post into community_public
-- posts_insert: WITH CHECK (current_user_id() IS NOT NULL
--   AND user_has_min_role(community_id_via_space, 'free_member'))
-- owner has role 'owner' in community_public ≥ free_member ✓
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SAVEPOINT sp_post_insert;
SELECT lives_ok(
  $$ INSERT INTO public.posts (community_id, space_id, author_id, title, body)
     VALUES (
       '00000000-0000-0000-0000-000000000010',
       '00000000-0000-0000-0000-000000000040',
       '00000000-0000-0000-0000-000000000002',
       'RLS positive test post',
       'Inserted by owner in Gate 1 Part A test'
     ) $$,
  'owner can insert a post into community_public space'
);
ROLLBACK TO SAVEPOINT sp_post_insert;

-- ============================================================
-- COURSES
-- policies: courses_select_public (community is_private=false AND deleted_at IS NULL)
--           courses_select_member (is_community_member(community_id))
-- community_public has 1 course (…0060); community_private has 1 course (…0061)
-- ============================================================

-- 10. owner can select courses in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.courses
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 1,
  'owner can select 1 course in community_public'
);

-- 11. member_paid can select courses in community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.courses
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 1,
  'member_paid can select 1 course in community_public'
);

-- 12. member_paid can select courses in community_private
SELECT ok(
  (SELECT COUNT(*) FROM public.courses
   WHERE community_id = pgtap_helpers.fixture('community_private')) = 1,
  'member_paid can select 1 course in community_private'
);

-- ============================================================
-- MODULES
-- policies: modules_select_public (course→community is_private=false)
--           modules_select_member (is_community_member via course→community_id)
-- module …0070 belongs to course …0060 in community_public
-- ============================================================

-- 13. member_paid can select modules in community_public (via course …0060)
SELECT ok(
  (SELECT COUNT(*) FROM public.modules
   WHERE course_id = '00000000-0000-0000-0000-000000000060'::uuid) = 1,
  'member_paid can select 1 module in community_public'
);

-- ============================================================
-- LESSONS
-- policies: lessons_select_public (module→course→community is_private=false)
--           lessons_select_member (is_community_member via module→course→community_id)
-- lesson …0080 belongs to module …0070 → course …0060 → community_public
-- ============================================================

-- 14. member_paid can select lessons in community_public (via module …0070)
SELECT ok(
  (SELECT COUNT(*) FROM public.lessons
   WHERE module_id = '00000000-0000-0000-0000-000000000070'::uuid) = 1,
  'member_paid can select 1 lesson in community_public'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
