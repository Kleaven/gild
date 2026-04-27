-- ============================================================================
-- Migration 00015 — Invitations
-- Email invitations to join a community. token is the unguessable secret
-- placed in the invite URL. The partial unique index on (community_id,
-- email) WHERE accepted_at IS NULL prevents duplicate pending invites
-- without blocking re-invites after a previous one was accepted.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  invited_by   uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  email        text NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role         public.member_role NOT NULL DEFAULT 'free_member',
  token        text NOT NULL UNIQUE,
  accepted_at  timestamptz NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON public.invitations (token);

CREATE INDEX IF NOT EXISTS idx_invitations_community
  ON public.invitations (community_id);

CREATE INDEX IF NOT EXISTS idx_invitations_email
  ON public.invitations (email);

-- Partial unique: at most one pending invite per (community, email).
-- Accepted invites are exempt so re-inviting after acceptance is allowed.
CREATE UNIQUE INDEX IF NOT EXISTS invitations_community_email_pending_key
  ON public.invitations (community_id, email)
  WHERE accepted_at IS NULL;
