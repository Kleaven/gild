-- ============================================================================
-- Migration: SOTA Governance & Global Billing
-- ============================================================================

SET search_path = public, extensions;

-- 1. Add custom messages to communities
ALTER TABLE public.communities
ADD COLUMN welcome_message text NULL CHECK (char_length(welcome_message) <= 2000),
ADD COLUMN goodbye_message text NULL CHECK (char_length(goodbye_message) <= 2000);

-- 2. Add platform billing to profiles
ALTER TABLE public.profiles
ADD COLUMN stripe_customer_id     text UNIQUE NULL,
ADD COLUMN stripe_subscription_id text UNIQUE NULL,
ADD COLUMN subscription_status    text NOT NULL DEFAULT 'inactive'
                                   CHECK (subscription_status IN (
                                     'inactive', 'trialing', 'active', 'past_due',
                                     'canceled', 'unpaid', 'incomplete'
                                   )),
ADD COLUMN plan                   text NULL CHECK (plan IN ('hobby', 'pro'));

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- 3. Add granular permissions to community members
ALTER TABLE public.community_members
ADD COLUMN permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. RPC to check platform subscription (used for paywalls)
CREATE OR REPLACE FUNCTION public.has_platform_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND subscription_status IN ('active', 'trialing')
  );
END;
$$;

-- 5. RPC to update admin permissions
CREATE OR REPLACE FUNCTION public.update_member_permissions(
  p_community_id uuid,
  p_user_id uuid,
  p_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only owners or admins with 'manage_roles' permission can update permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
    AND user_id = auth.uid()
    AND (role = 'owner' OR (role = 'admin' AND permissions->>'manage_roles' = 'true'))
  ) THEN
    RAISE EXCEPTION 'Not authorized to update member permissions';
  END IF;

  UPDATE public.community_members
  SET permissions = p_permissions,
      updated_at = now()
  WHERE community_id = p_community_id
  AND user_id = p_user_id;
END;
$$;
