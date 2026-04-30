-- ============================================================
-- Migration 00051: RLS policies — audit_logs
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- audit_logs_select
-- Platform admins have full access. Community admins can read audit logs
-- for their own community. community_id is nullable — the IS NOT NULL
-- guard prevents passing NULL to user_has_min_role.
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    is_platform_admin()
    OR (community_id IS NOT NULL AND user_has_min_role(community_id, 'admin'))
  );

-- audit_logs_insert
-- Audit logs are written server-side only.
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- audit_logs_update
-- Audit logs are immutable — lock direct UPDATE to platform_admin.
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
CREATE POLICY "audit_logs_update"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- audit_logs_delete
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_delete"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
