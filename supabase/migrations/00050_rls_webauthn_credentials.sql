-- ============================================================
-- Migration 00050: RLS policies — webauthn_credentials
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials FORCE ROW LEVEL SECURITY;

-- webauthn_credentials_select
-- webauthn_credentials has no user_id column; ownership is resolved via
-- admin_id → platform_admins.user_id.
DROP POLICY IF EXISTS "webauthn_credentials_select" ON public.webauthn_credentials;
CREATE POLICY "webauthn_credentials_select"
  ON public.webauthn_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.id = admin_id
        AND pa.user_id = current_user_id()
    )
    OR is_platform_admin()
  );

-- webauthn_credentials_insert
DROP POLICY IF EXISTS "webauthn_credentials_insert" ON public.webauthn_credentials;
CREATE POLICY "webauthn_credentials_insert"
  ON public.webauthn_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.id = admin_id
        AND pa.user_id = current_user_id()
    )
  );

-- webauthn_credentials_update
DROP POLICY IF EXISTS "webauthn_credentials_update" ON public.webauthn_credentials;
CREATE POLICY "webauthn_credentials_update"
  ON public.webauthn_credentials
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.id = admin_id
        AND pa.user_id = current_user_id()
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.id = admin_id
        AND pa.user_id = current_user_id()
    )
    OR is_platform_admin()
  );

-- webauthn_credentials_delete
DROP POLICY IF EXISTS "webauthn_credentials_delete" ON public.webauthn_credentials;
CREATE POLICY "webauthn_credentials_delete"
  ON public.webauthn_credentials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.id = admin_id
        AND pa.user_id = current_user_id()
    )
    OR is_platform_admin()
  );
