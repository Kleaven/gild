-- ============================================================================
-- Migration 00017 — Webhook events (idempotency)
-- Required for Gate 2 (Step 28). Every incoming webhook is upserted by
-- (provider, event_id); the handler runs only when processed_at IS NULL,
-- so duplicate deliveries from Stripe become no-ops. provider is a CHECK
-- enum-by-text rather than a Postgres enum so adding new providers is a
-- single CHECK swap rather than an ALTER TYPE.
-- attempt_count and error capture transient failures for observability;
-- there is no updated_at — the row's lifecycle is fully described by
-- created_at, attempt_count, error, and processed_at.
-- ============================================================================

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  event_id      text NOT NULL,
  event_type    text NOT NULL,
  payload       jsonb NOT NULL,
  processed_at  timestamptz NULL,
  error         text NULL,
  attempt_count smallint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_provider_event_key UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
  ON public.webhook_events (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
  ON public.webhook_events (created_at)
  WHERE processed_at IS NULL;
