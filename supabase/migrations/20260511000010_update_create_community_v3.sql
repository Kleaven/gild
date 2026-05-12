-- Migration: Update create_community RPC for Recurring Pricing
-- Updates the signature to accept pricing periods (one_time, monthly, yearly).

DROP FUNCTION IF EXISTS public.create_community(text, text, text, boolean, text, integer, text, text, text, numeric, text);

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
  v_owner_plan   text;
  v_fee_percent  numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  -- Determine platform fee based on owner plan
  SELECT plan INTO v_owner_plan FROM public.profiles WHERE id = v_user_id;
  IF v_owner_plan = 'pro' THEN
    v_fee_percent := 0.0;
  ELSE
    v_fee_percent := 4.0;
  END IF;

  INSERT INTO public.communities (
    name, slug, description, owner_id, is_private, category, 
    theme_hue, welcome_message, goodbye_message,
    pricing_type, price_amount, price_currency, pricing_period, platform_fee_percent
  )
  VALUES (
    p_name, p_slug, p_description, v_user_id, p_is_private, p_category, 
    p_theme_hue, p_welcome_message, p_goodbye_message,
    p_pricing_type, p_price_amount, p_price_currency, p_pricing_period, v_fee_percent
  )
  RETURNING id INTO v_community_id;

  -- Owner is automatically a member with role 'owner'.
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  -- Initialise member_count.
  UPDATE public.communities
  SET member_count = 1
  WHERE id = v_community_id;

  RETURN v_community_id;
END;
$$;
