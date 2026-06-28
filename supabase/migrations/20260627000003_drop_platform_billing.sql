-- ============================================================================
-- Migration 20260627000003 — Drop the dead platform-subscription rail
-- "Pro" is now a per-community subscription (communities.plan). The old
-- account-level platform subscription gated community creation, which is now
-- free — so has_platform_subscription() has no remaining callers. Drop it.
--
-- Surgical: the now-dormant profiles.plan / profiles.subscription_status and
-- communities.platform_fee_percent columns are LEFT in place (no data risk);
-- they are simply unused by application code.
-- ============================================================================

SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.has_platform_subscription(uuid);
