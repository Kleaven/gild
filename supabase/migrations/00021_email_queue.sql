-- ============================================================================
-- Migration 00021 — Outbound email queue
-- Decouples email sending from request handlers. Resend (Step 50) will be
-- the provider; the queue is needed earlier because Stripe webhooks at
-- Step 40 already enqueue transactional mail. scheduled_at supports
-- future-dated sends (e.g. trial-expiry warnings) — workers should poll
-- WHERE status='pending' AND scheduled_at <= now().
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- email_status enum
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'email_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.email_status AS ENUM (
      'pending',
      'sent',
      'failed',
      'cancelled'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.email_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email     text NOT NULL,
  to_name      text NULL,
  subject      text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  template     text NOT NULL CHECK (char_length(template) BETWEEN 1 AND 100),
  variables    jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       public.email_status NOT NULL DEFAULT 'pending',
  provider_id  text NULL,
  error        text NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status
  ON public.email_queue (status, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_to_email
  ON public.email_queue (to_email);

CREATE OR REPLACE TRIGGER set_updated_at_email_queue
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
