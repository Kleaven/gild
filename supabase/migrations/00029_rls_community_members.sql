-- ============================================================
-- Migration 00029: RLS policies — community_members
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members FORCE ROW LEVEL SECURITY;

-- community_members_select
DROP POLICY IF EXISTS "community_members_select" ON public.community_members;
CREATE POLICY "community_members_select"
  ON public.community_members
  FOR SELECT
  TO authenticated
  USING (is_community_member(community_id) OR is_platform_admin());

-- community_members_insert
-- Direct INSERT locked to platform_admin only — join_community RPC
-- (SECURITY DEFINER) is the real join path.
DROP POLICY IF EXISTS "community_members_insert" ON public.community_members;
CREATE POLICY "community_members_insert"
  ON public.community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- community_members_update
-- Direct UPDATE locked to platform_admin only — update_member_role RPC
-- (SECURITY DEFINER) owns this mutation path and enforces role hierarchy
-- invariants (no self-promotion to owner, no owner demotion). Allowing
-- direct DML here bypasses those guards entirely.
DROP POLICY IF EXISTS "community_members_update" ON public.community_members;
CREATE POLICY "community_members_update"
  ON public.community_members
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- community_members_delete
-- Self-removal is blocked here — leave_community RPC (SECURITY DEFINER)
-- is the correct self-removal path and handles subscription/audit cleanup.
-- Admin-level kicks use direct DELETE (no kick_member RPC exists in v1).
-- TODO before moderation launch: add kick_member SECURITY DEFINER RPC
-- to add audit trail and webhook firing to admin kicks.
DROP POLICY IF EXISTS "community_members_delete" ON public.community_members;
CREATE POLICY "community_members_delete"
  ON public.community_members
  FOR DELETE
  TO authenticated
  USING (
    user_has_min_role(community_id, 'admin')
    OR is_platform_admin()
  );
