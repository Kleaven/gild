-- Migration: Community Revenue Tracking
-- Tracks individual payments and subscription renewals for community monetization.

CREATE TABLE IF NOT EXISTS public.community_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  stripe_session_id text UNIQUE,
  stripe_invoice_id text UNIQUE,
  type text NOT NULL CHECK (type IN ('one_time', 'subscription')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_revenue ENABLE ROW LEVEL SECURITY;

-- Policy: Community owners can view their revenue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_revenue' 
    AND policyname = 'Community owners can view revenue'
  ) THEN
    CREATE POLICY "Community owners can view revenue"
      ON public.community_revenue
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.communities
          WHERE id = community_revenue.community_id
          AND owner_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Index for dashboard performance
CREATE INDEX IF NOT EXISTS idx_community_revenue_community_id ON public.community_revenue(community_id);
CREATE INDEX IF NOT EXISTS idx_community_revenue_created_at ON public.community_revenue(created_at);
