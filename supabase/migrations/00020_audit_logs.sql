-- ============================================================================
-- Migration 00020 — Audit logs
-- Append-only record of significant actions. Both community_id and
-- actor_id are nullable + ON DELETE SET NULL so the audit trail survives
-- the deletion of either party. action is a free-form text rather than an
-- enum so new event types can be added without a schema change.
-- target_id is a polymorphic UUID; target_type names the table it points
-- at. ip_address uses Postgres inet for native subnet querying.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NULL REFERENCES public.communities (id) ON DELETE SET NULL,
  actor_id     uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  action       text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  target_type  text NULL,
  target_id    uuid NULL,
  metadata     jsonb NULL,
  ip_address   inet NULL,
  user_agent   text NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_community
  ON public.audit_logs (community_id)
  WHERE community_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs (actor_id)
  WHERE actor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON public.audit_logs (created_at DESC);
