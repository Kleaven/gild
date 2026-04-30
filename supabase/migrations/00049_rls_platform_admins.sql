-- ============================================================
-- Migration 00049: RLS policies — platform_admins
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;

-- platform_admins_select
DROP POLICY IF EXISTS "platform_admins_select" ON public.platform_admins;
CREATE POLICY "platform_admins_select"
  ON public.platform_admins
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- platform_admins_insert
DROP POLICY IF EXISTS "platform_admins_insert" ON public.platform_admins;
CREATE POLICY "platform_admins_insert"
  ON public.platform_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- platform_admins_update
DROP POLICY IF EXISTS "platform_admins_update" ON public.platform_admins;
CREATE POLICY "platform_admins_update"
  ON public.platform_admins
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- platform_admins_delete
DROP POLICY IF EXISTS "platform_admins_delete" ON public.platform_admins;
CREATE POLICY "platform_admins_delete"
  ON public.platform_admins
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
