-- ============================================================
-- Migration 00034: RLS policies — votes
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes FORCE ROW LEVEL SECURITY;

-- votes_select
-- Users can only see their own votes; platform admins have full access.
-- Vote counts are aggregate data — raw vote rows are never exposed to other users.
DROP POLICY IF EXISTS "votes_select" ON public.votes;
CREATE POLICY "votes_select"
  ON public.votes
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_platform_admin()
  );

-- votes_insert
-- Locked to platform_admin only — toggle_vote RPC (SECURITY DEFINER) is the
-- only correct insertion path and enforces membership and idempotency checks.
DROP POLICY IF EXISTS "votes_insert" ON public.votes;
CREATE POLICY "votes_insert"
  ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- votes_update
-- Votes are immutable records — toggle_vote deletes and re-inserts.
-- No direct UPDATE path exists or should exist.
DROP POLICY IF EXISTS "votes_update" ON public.votes;
CREATE POLICY "votes_update"
  ON public.votes
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- votes_delete
-- Locked to platform_admin only — toggle_vote RPC handles untoggling.
DROP POLICY IF EXISTS "votes_delete" ON public.votes;
CREATE POLICY "votes_delete"
  ON public.votes
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
