-- ============================================================
-- Migration 00046: RLS policies — reports
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;

-- reports_select
-- reports has a direct community_id column. Reporters can see their own
-- submissions; community admins can see all reports in their community;
-- platform admins have full access. reporter_id is nullable (ON DELETE
-- SET NULL) — the equality check safely returns false when NULL.
DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = current_user_id()
    OR user_has_min_role(community_id, 'admin')
    OR is_platform_admin()
  );

-- reports_insert
-- Any authenticated user can file a report.
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (current_user_id() IS NOT NULL);

-- reports_update
-- Community admins can update report status (resolve/dismiss) for their
-- community. Platform admins have full access.
DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (user_has_min_role(community_id, 'admin') OR is_platform_admin())
  WITH CHECK (user_has_min_role(community_id, 'admin') OR is_platform_admin());

-- reports_delete
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
CREATE POLICY "reports_delete"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
