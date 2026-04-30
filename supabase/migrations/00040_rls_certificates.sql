-- ============================================================
-- Migration 00040: RLS policies — certificates
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates FORCE ROW LEVEL SECURITY;

-- certificates_select
-- Users see their own certificates. Community admins see certificates for
-- their community's courses. Platform admins have full access.
DROP POLICY IF EXISTS "certificates_select" ON public.certificates;
CREATE POLICY "certificates_select"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR user_has_min_role(
      (SELECT community_id FROM public.courses WHERE id = course_id),
      'admin'
    )
    OR is_platform_admin()
  );

-- certificates_insert
-- Locked to platform_admin only — complete_lesson RPC (SECURITY DEFINER)
-- issues certificates on course completion.
DROP POLICY IF EXISTS "certificates_insert" ON public.certificates;
CREATE POLICY "certificates_insert"
  ON public.certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- certificates_update
-- Locked to platform_admin only — certificates are immutable records.
DROP POLICY IF EXISTS "certificates_update" ON public.certificates;
CREATE POLICY "certificates_update"
  ON public.certificates
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- certificates_delete
DROP POLICY IF EXISTS "certificates_delete" ON public.certificates;
CREATE POLICY "certificates_delete"
  ON public.certificates
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
