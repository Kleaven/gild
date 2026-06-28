-- ============================================================================
-- Migration 20260627000002 — Free / Pro pricing
-- Renames the entry plan from 'hobby' to 'free' and makes Free the default.
-- Under the new model communities are created on Free ($0, no card, no Stripe
-- subscription); the 5% member-transaction fee (applied in app code via the
-- Connect application fee) is the upgrade engine. Pro ($29) sets plan='pro'.
--
-- Idempotent: safe to re-run. Drops the old CHECK, remaps existing rows, then
-- re-adds the constraint with the new value set + default.
-- ============================================================================

SET search_path = public, extensions;

-- 1. Remap any existing 'hobby' rows to 'free' BEFORE tightening the constraint.
--    (Constraint currently allows 'hobby'/'pro' — or 'starter'/'pro' on very
--    old DBs; remap both legacy entry names to 'free'.)
ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS communities_plan_check;

UPDATE public.communities SET plan = 'free' WHERE plan IN ('hobby', 'starter');

ALTER TABLE public.communities ALTER COLUMN plan SET DEFAULT 'free';

ALTER TABLE public.communities
  ADD CONSTRAINT communities_plan_check CHECK (plan IN ('free', 'pro'));

-- 2. profiles also carries a plan column on some schemas (platform-level). If
--    present, remap + relax its constraint the same way. Guarded so this runs
--    cleanly whether or not the column/constraint exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check';
    EXECUTE $q$UPDATE public.profiles SET plan = 'free' WHERE plan IN ('hobby', 'starter')$q$;
    EXECUTE $q$ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free'$q$;
    EXECUTE $q$ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro'))$q$;
  END IF;
END $$;

-- 3. platform_fee_percent — the stored mirror of the take rate. The live fee is
--    applied in app code off communities.plan (5% Free / 0% Pro); this column
--    is kept consistent so the data isn't misleading. Bring it to the new model.
ALTER TABLE public.communities ALTER COLUMN platform_fee_percent SET DEFAULT 5.0;
UPDATE public.communities SET platform_fee_percent = 5.0 WHERE plan = 'free';
UPDATE public.communities SET platform_fee_percent = 0.0 WHERE plan = 'pro';
COMMENT ON COLUMN public.communities.platform_fee_percent IS 'Mirror of the take rate by community plan (Free: 5%, Pro: 0%). Live fee is applied in app code off communities.plan.';

-- 4. create_community no longer derives the fee from the owner's profile plan
--    (platform subscriptions are gone). New communities are Free → 5%.
CREATE OR REPLACE FUNCTION public.create_community(
  p_name             text,
  p_slug             text,
  p_description      text DEFAULT NULL,
  p_is_private       boolean DEFAULT false,
  p_category         text DEFAULT NULL,
  p_theme_hue        integer DEFAULT 250,
  p_welcome_message  text DEFAULT NULL,
  p_goodbye_message  text DEFAULT NULL,
  p_pricing_type     text DEFAULT 'free',
  p_price_amount     numeric DEFAULT 0,
  p_price_currency   text DEFAULT 'USD',
  p_pricing_period   text DEFAULT 'one_time'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_community_id uuid;
  v_user_id      uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  INSERT INTO public.communities (
    name, slug, description, owner_id, is_private, category,
    theme_hue, welcome_message, goodbye_message,
    pricing_type, price_amount, price_currency, pricing_period,
    plan, platform_fee_percent
  )
  VALUES (
    p_name, p_slug, p_description, v_user_id, p_is_private, p_category,
    p_theme_hue, p_welcome_message, p_goodbye_message,
    p_pricing_type, p_price_amount, p_price_currency, p_pricing_period,
    'free', 5.0
  )
  RETURNING id INTO v_community_id;

  -- Owner is automatically a member with role 'owner'.
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  UPDATE public.communities SET member_count = 1 WHERE id = v_community_id;

  RETURN v_community_id;
END;
$$;
