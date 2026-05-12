#!/bin/bash
set -e
supabase db query "CREATE TABLE IF NOT EXISTS public.community_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  stripe_session_id text UNIQUE,
  stripe_invoice_id text UNIQUE,
  type text NOT NULL CHECK (type IN ('one_time', 'subscription')),
  created_at timestamptz NOT NULL DEFAULT now()
);"
supabase db query "ALTER TABLE public.community_revenue ENABLE ROW LEVEL SECURITY;"
supabase db query "DROP POLICY IF EXISTS \"Community owners can view revenue\" ON public.community_revenue;"
supabase db query "CREATE POLICY \"Community owners can view revenue\" ON public.community_revenue FOR SELECT USING (EXISTS (SELECT 1 FROM public.communities WHERE id = community_revenue.community_id AND owner_id = auth.uid()));"
supabase db query "CREATE INDEX IF NOT EXISTS idx_community_revenue_community_id ON public.community_revenue(community_id);"
supabase db query "CREATE INDEX IF NOT EXISTS idx_community_revenue_created_at ON public.community_revenue(created_at);"
