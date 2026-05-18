-- ============================================================================
-- Migration 20260518000005 — P1 database hardening
--
-- Two small but real bugs surfaced in the 2026-05-18 audit:
--
-- 1. public.community_revenue had RLS enabled but NOT forced. Every other
--    public table in this codebase uses FORCE ROW LEVEL SECURITY for
--    defense-in-depth (so the postgres table-owner role cannot bypass
--    the policies). community_revenue holds Stripe revenue records —
--    arguably the most sensitive financial data on the platform — and
--    should match the standard.
--
-- 2. public.reports.INSERT policy was `WITH CHECK (current_user_id() IS NOT NULL)`.
--    Net effect: any signed-in user could file moderation reports against
--    posts/comments in communities they aren't members of, opening a spam
--    vector against moderators of public-facing communities. Scope the
--    policy to community members so non-members can't file reports.
--
-- Both changes are idempotent (DROP/CREATE pattern). No data migration —
-- existing rows are unaffected.
-- ============================================================================

SET search_path = public, extensions;

-- ─── 1. community_revenue: force RLS ────────────────────────────────────────
ALTER TABLE public.community_revenue FORCE ROW LEVEL SECURITY;

-- ─── 2. reports_insert: only members of the target community can file ───────
-- Same predicate shape as reports_select for is_community_member, plus the
-- pinned reporter_id = current_user_id() check so a member can't forge the
-- reporter on someone else's behalf.
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = (SELECT public.current_user_id())
    AND public.is_community_member(community_id)
  );
