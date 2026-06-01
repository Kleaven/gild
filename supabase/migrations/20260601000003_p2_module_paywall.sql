-- Phase 2c — per-module paywall
-- A module may require a membership tier. NULL = free (no paywall). Gating is
-- "that tier or higher": a member whose tier position ≥ the module's required
-- tier position unlocks it. ON DELETE SET NULL so archiving a tier never
-- orphans a module (it falls back to free).

SET search_path = public, extensions;

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS min_tier_id uuid
    REFERENCES public.membership_tiers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_modules_min_tier ON public.modules (min_tier_id)
  WHERE min_tier_id IS NOT NULL;
