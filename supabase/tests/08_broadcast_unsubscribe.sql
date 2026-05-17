-- ============================================================
-- 08_broadcast_unsubscribe.sql
-- Covers the broadcast newsletter feature:
--   • set_broadcast_opt_out RPC — self-scoped (cannot touch other rows)
--   • email_queue idempotency index — second INSERT of same
--     (template, to_email, postId) silently dedupes via ON CONFLICT
--   • community_members.unsubscribe_token — UNIQUE and auto-generated
-- ============================================================
BEGIN;
SELECT plan(8);

-- ============================================================
-- 1. unsubscribe_token: auto-generated and UNIQUE per membership
-- ============================================================
SELECT ok(
  (SELECT COUNT(*) FROM public.community_members WHERE unsubscribe_token IS NULL) = 0,
  'every membership has a non-null unsubscribe_token'
);

SELECT ok(
  (SELECT COUNT(DISTINCT unsubscribe_token) = COUNT(*) FROM public.community_members),
  'unsubscribe_token values are unique across community_members'
);

-- ============================================================
-- 2. set_broadcast_opt_out: member can flip own preference
-- ============================================================
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));

SELECT public.set_broadcast_opt_out(
  pgtap_helpers.fixture('community_public'),
  true
);

SELECT ok(
  (SELECT broadcast_opt_out
     FROM public.community_members
    WHERE community_id = pgtap_helpers.fixture('community_public')
      AND user_id      = pgtap_helpers.fixture('member_paid')) = true,
  'member_paid flipped broadcast_opt_out to true on own membership'
);

-- And can flip back
SELECT public.set_broadcast_opt_out(
  pgtap_helpers.fixture('community_public'),
  false
);

SELECT ok(
  (SELECT broadcast_opt_out
     FROM public.community_members
    WHERE community_id = pgtap_helpers.fixture('community_public')
      AND user_id      = pgtap_helpers.fixture('member_paid')) = false,
  'member_paid flipped broadcast_opt_out back to false'
);

-- ============================================================
-- 3. set_broadcast_opt_out: CANNOT touch another user's row
-- The RPC scopes UPDATE to auth.uid() — calling with a different
-- community where the caller isn't a member is a silent no-op
-- (no exception, no row mutation). Confirm owner's row is unchanged
-- after member_paid attempts to "opt out" the owner via this RPC.
-- ============================================================

-- Baseline: owner is currently subscribed in their own community
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT public.set_broadcast_opt_out(
  pgtap_helpers.fixture('community_public'),
  false
);

-- member_paid attempts to opt the owner out — RPC matches on auth.uid()
-- so the WHERE clause user_id = auth.uid() finds member_paid's row only.
-- Owner's row is untouched.
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('member_paid'));
SELECT public.set_broadcast_opt_out(
  pgtap_helpers.fixture('community_public'),
  true
);

SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('owner'));
SELECT ok(
  (SELECT broadcast_opt_out
     FROM public.community_members
    WHERE community_id = pgtap_helpers.fixture('community_public')
      AND user_id      = pgtap_helpers.fixture('owner')) = false,
  'owner row is untouched after member_paid called set_broadcast_opt_out'
);

-- ============================================================
-- 4. email_queue idempotency: second INSERT of same
-- (COMMUNITY_BROADCAST, to_email, postId) with status pending
-- is rejected by the partial unique index.
-- Run as platform_admin so RLS on email_queue doesn't intervene
-- (the index check is independent of RLS).
-- ============================================================
SELECT pgtap_helpers.set_auth(pgtap_helpers.fixture('platform_admin'));

-- First insert succeeds
SAVEPOINT sp_first_broadcast;
INSERT INTO public.email_queue (to_email, subject, template, variables)
VALUES (
  'idem-test@example.com',
  'Test broadcast',
  'COMMUNITY_BROADCAST',
  jsonb_build_object('postId', '00000000-0000-0000-0000-0000000000aa')
);

SELECT ok(
  (SELECT COUNT(*) FROM public.email_queue
    WHERE template = 'COMMUNITY_BROADCAST'
      AND to_email = 'idem-test@example.com'
      AND variables->>'postId' = '00000000-0000-0000-0000-0000000000aa') = 1,
  'first broadcast row inserted'
);

-- Second insert with same (template, to_email, postId) collides on the
-- partial unique index. throws_ok catches the constraint violation;
-- we don't care about the exact error code.
SELECT throws_ok(
  $$ INSERT INTO public.email_queue (to_email, subject, template, variables)
     VALUES (
       'idem-test@example.com',
       'Test broadcast (duplicate)',
       'COMMUNITY_BROADCAST',
       jsonb_build_object('postId', '00000000-0000-0000-0000-0000000000aa')
     ) $$,
  '23505',
  NULL,
  'duplicate (template, to_email, postId) is blocked by unique index'
);

-- Inserting the SAME (template, to_email) but a DIFFERENT postId is allowed —
-- the index is scoped to per-post idempotency, not per-recipient lockout.
SAVEPOINT sp_different_post;
INSERT INTO public.email_queue (to_email, subject, template, variables)
VALUES (
  'idem-test@example.com',
  'Test broadcast (different post)',
  'COMMUNITY_BROADCAST',
  jsonb_build_object('postId', '00000000-0000-0000-0000-0000000000bb')
);

SELECT ok(
  (SELECT COUNT(*) FROM public.email_queue
    WHERE template = 'COMMUNITY_BROADCAST'
      AND to_email = 'idem-test@example.com') = 2,
  'different postId for same recipient inserts cleanly (per-post idempotency)'
);

SELECT pgtap_helpers.clear_auth();
SELECT * FROM finish();
ROLLBACK;
