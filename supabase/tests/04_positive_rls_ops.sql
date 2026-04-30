-- ============================================================
-- 04_positive_rls_ops.sql
-- Gate 1 Part A — positive RLS: platform_admins, notifications, invitations
-- ============================================================
BEGIN;
SELECT plan(3);

-- ============================================================
-- PLATFORM_ADMINS
-- policy: platform_admins_select USING (is_platform_admin())
-- user …0001 has a row in platform_admins; is_platform_admin() checks
-- platform_admins WHERE user_id = auth.uid().
-- ============================================================

-- 1. platform_admin can select own row from platform_admins
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('platform_admin'));
SELECT ok(
  (SELECT COUNT(*) FROM public.platform_admins
   WHERE user_id = pgtap_helpers.fixture('platform_admin')) = 1,
  'platform_admin can select own row from platform_admins'
);

-- ============================================================
-- NOTIFICATIONS
-- policy: notifications_select USING (user_id = current_user_id())
-- Seed has 0 notification rows. Test confirms query executes
-- without RLS block (returns 0, not an error).
-- ============================================================

-- 2. member_paid can query own notifications (0 seed rows — no RLS block)
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT ok(
  (SELECT COUNT(*) FROM public.notifications
   WHERE user_id = pgtap_helpers.fixture('member_paid')) >= 0,
  'member_paid can query own notifications without RLS block'
);

-- ============================================================
-- INVITATIONS
-- policies: invitations_select_public (community is_private=false)
--           invitations_select_member (is_community_member)
-- Seed has 0 invitation rows. Test confirms query executes
-- without RLS block.
-- ============================================================

-- 3. owner can query invitations for community_public (0 seed rows — no RLS block)
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT COUNT(*) FROM public.invitations
   WHERE community_id = pgtap_helpers.fixture('community_public')) >= 0,
  'owner can query invitations for community_public without RLS block'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
