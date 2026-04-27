-- ============================================================================
-- Migration 00019 — Platform admins and WebAuthn credentials
-- Required for Gate 3 (Step 30). Platform admins authenticate via WebAuthn
-- only — no passwords. platform_admins is a thin allow-list keyed on
-- auth.users; webauthn_credentials stores one or more authenticators per
-- admin (e.g. primary YubiKey + backup). sign_count is the resident
-- counter used to detect cloned authenticators on every assertion.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- platform_admins
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- webauthn_credentials
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      uuid NOT NULL REFERENCES public.platform_admins (id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key    text NOT NULL,
  sign_count    bigint NOT NULL DEFAULT 0,
  device_type   text NOT NULL DEFAULT 'unknown'
                  CHECK (device_type IN ('singleDevice', 'multiDevice', 'unknown')),
  backed_up     boolean NOT NULL DEFAULT false,
  transports    text[] NULL,
  friendly_name text NULL CHECK (char_length(friendly_name) <= 100),
  last_used_at  timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_admin
  ON public.webauthn_credentials (admin_id);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id
  ON public.webauthn_credentials (credential_id);

CREATE OR REPLACE TRIGGER set_updated_at_webauthn_credentials
  BEFORE UPDATE ON public.webauthn_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
