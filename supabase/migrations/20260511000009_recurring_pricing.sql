-- Migration: Recurring Community Memberships
-- Adds support for monthly and yearly subscription fees for communities.

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS pricing_period text NOT NULL DEFAULT 'one_time' 
CHECK (pricing_period IN ('one_time', 'monthly', 'yearly'));

COMMENT ON COLUMN public.communities.pricing_period IS 'The billing cycle for paid communities (one_time, monthly, or yearly).';
