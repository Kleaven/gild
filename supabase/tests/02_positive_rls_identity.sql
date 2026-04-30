-- ============================================================
-- 02_positive_rls_identity.sql
-- Gate 1 Part A — positive RLS: profiles, communities,
-- community_members, membership_tiers
-- ============================================================
BEGIN;
SELECT plan(16);

-- ============================================================
-- PROFILES
-- Policy: profiles_select TO authenticated USING (auth.uid() IS NOT NULL)
-- Any authenticated user can see any profile.
-- ============================================================

-- 1. owner can select own profile row
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id = pgtap_helpers.fixture('owner')) = 1,
  'owner can select own profile row'
);

-- 2. member_paid can select own profile row
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id = pgtap_helpers.fixture('member_paid')) = 1,
  'member_paid can select own profile row'
);

-- 3. member_paid can select owner profile (cross-user read)
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id = pgtap_helpers.fixture('owner')) = 1,
  'member_paid can select owner profile'
);

-- 4. member_free can select own profile row
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id = pgtap_helpers.fixture('member_free')) = 1,
  'member_free can select own profile row'
);

-- 5. owner can update own profile
-- profiles_update: USING (id = current_user_id() OR is_platform_admin())
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SAVEPOINT sp_profile_update;
SELECT results_eq(
  $$ WITH u AS (
       UPDATE public.profiles
          SET bio = 'Updated bio for RLS test'
        WHERE id = pgtap_helpers.fixture('owner')
       RETURNING id
     )
     SELECT id FROM u $$,
  $$ SELECT pgtap_helpers.fixture('owner') $$,
  'owner can update own profile'
);
ROLLBACK TO SAVEPOINT sp_profile_update;

-- ============================================================
-- COMMUNITIES
-- policies: communities_select_public (is_private=false AND deleted_at IS NULL)
--           communities_select_member (is_private=true AND is_community_member(id))
-- ============================================================

-- 6. owner can select community_public (is_private=false)
SELECT ok(
  (SELECT COUNT(*) FROM public.communities
   WHERE id = pgtap_helpers.fixture('community_public')) = 1,
  'owner can select community_public'
);

-- 7. owner can select community_private (owner is a member)
SELECT ok(
  (SELECT COUNT(*) FROM public.communities
   WHERE id = pgtap_helpers.fixture('community_private')) = 1,
  'owner can select community_private'
);

-- 8. member_paid can select community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.communities
   WHERE id = pgtap_helpers.fixture('community_public')) = 1,
  'member_paid can select community_public'
);

-- 9. member_paid can select community_private (member_paid is in community_private)
SELECT ok(
  (SELECT COUNT(*) FROM public.communities
   WHERE id = pgtap_helpers.fixture('community_private')) = 1,
  'member_paid can select community_private'
);

-- 10. member_free can select community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SELECT ok(
  (SELECT COUNT(*) FROM public.communities
   WHERE id = pgtap_helpers.fixture('community_public')) = 1,
  'member_free can select community_public'
);

-- ============================================================
-- COMMUNITY_MEMBERS
-- policy: USING (is_community_member(community_id) OR is_platform_admin())
-- Querying user must be a non-banned member. Sees ALL rows of that community.
-- community_public has 4 members (owner, paid, free, banned rows)
-- community_private has 2 members (owner, paid)
-- ============================================================

-- 11. owner can select all 4 members of community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.community_members
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 4,
  'owner can select all 4 members of community_public'
);

-- 12. member_paid can select members of community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.community_members
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 4,
  'member_paid can select members of community_public'
);

-- 13. member_paid can select members of community_private (2 rows)
SELECT ok(
  (SELECT COUNT(*) FROM public.community_members
   WHERE community_id = pgtap_helpers.fixture('community_private')) = 2,
  'member_paid can select 2 members of community_private'
);

-- ============================================================
-- MEMBERSHIP_TIERS
-- policies: membership_tiers_select_public (community is public)
--           membership_tiers_select_member (is_community_member)
-- community_public has 2 tiers (Free + Pro); community_private has 0.
-- ============================================================

-- 14. member_paid can select tiers for community_public
SELECT ok(
  (SELECT COUNT(*) FROM public.membership_tiers
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_paid can select 2 tiers for community_public'
);

-- 15. member_free can select tiers for community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_free'));
SELECT ok(
  (SELECT COUNT(*) FROM public.membership_tiers
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'member_free can select 2 tiers for community_public'
);

-- 16. owner can select tiers for community_public
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.membership_tiers
   WHERE community_id = pgtap_helpers.fixture('community_public')) = 2,
  'owner can select 2 tiers for community_public'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
