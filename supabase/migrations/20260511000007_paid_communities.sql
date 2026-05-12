-- Migration: Paid Communities & Fees
-- Adds pricing support to communities and tracks platform fee structures.

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid')),
ADD COLUMN IF NOT EXISTS price_amount numeric(10, 2) NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS platform_fee_percent numeric(5, 2) NOT NULL DEFAULT 4.0;

COMMENT ON COLUMN public.communities.platform_fee_percent IS 'Platform fee percentage based on the owner subscription tier (Hobby: 4%, Pro: 0%).';

-- Update existing communities: Pro owners get 0% fees, others get 4%
UPDATE public.communities c
SET platform_fee_percent = 0.0
FROM public.profiles p
WHERE c.owner_id = p.id AND p.plan = 'pro';
