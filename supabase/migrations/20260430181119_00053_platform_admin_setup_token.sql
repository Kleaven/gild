-- ============================================================================
-- Migration: Add setup_token to platform_admins
--
-- This token is generated during admin bootstrap to allow a one-time
-- setup of WebAuthn credentials, preventing the "Setup Race" security hole.
-- ============================================================================

SET search_path = public, extensions;

ALTER TABLE public.platform_admins
ADD COLUMN IF NOT EXISTS setup_token text NULL;

CREATE INDEX IF NOT EXISTS idx_platform_admins_setup_token
  ON public.platform_admins (setup_token);
