-- Migration: Role-Based Permissions & Polls
-- Implements community-wide and space-specific permission overrides, plus polling infrastructure.

-- 1. Community-wide role defaults
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS role_permissions jsonb NOT NULL DEFAULT '{
  "member": { "can_post": true, "can_comment": true, "can_invite": true },
  "admin": { "can_post": true, "can_comment": true, "can_invite": true, "manage_members": true, "manage_spaces": true }
}'::jsonb;

-- 2. Space-specific role overrides
ALTER TABLE public.spaces
ADD COLUMN IF NOT EXISTS role_permissions jsonb NOT NULL DEFAULT '{
  "member": { "can_post": true, "can_comment": true, "can_react": true, "can_view": true },
  "admin": { "can_post": true, "can_comment": true, "can_react": true, "can_view": true }
}'::jsonb;

-- 3. Polls Infrastructure
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'poll')),
ADD COLUMN IF NOT EXISTS poll_options jsonb NULL; -- Array of { id: string, text: string }

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  option_id    text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id) -- One vote per user per poll
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_post ON public.poll_votes (post_id);

-- 4. Permission Checker Function
CREATE OR REPLACE FUNCTION public.check_community_permission(
  p_community_id uuid,
  p_user_id      uuid,
  p_permission   text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role public.member_role;
  v_perms jsonb;
BEGIN
  -- Get user role
  SELECT role INTO v_role
  FROM public.community_members
  WHERE community_id = p_community_id AND user_id = p_user_id;

  IF v_role IS NULL THEN RETURN false; END IF;
  IF v_role = 'owner' THEN RETURN true; END IF;
  IF v_role = 'banned' THEN RETURN false; END IF;

  -- Get community defaults for this role
  SELECT role_permissions->v_role::text INTO v_perms
  FROM public.communities
  WHERE id = p_community_id;

  RETURN (v_perms->>p_permission)::boolean IS TRUE;
END;
$$;

-- 5. Space Permission Checker Function
CREATE OR REPLACE FUNCTION public.check_space_permission(
  p_space_id     uuid,
  p_user_id      uuid,
  p_permission   text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_community_id uuid;
  v_role         public.member_role;
  v_perms        jsonb;
BEGIN
  SELECT community_id INTO v_community_id FROM public.spaces WHERE id = p_space_id;
  
  -- Get user role
  SELECT role INTO v_role
  FROM public.community_members
  WHERE community_id = v_community_id AND user_id = p_user_id;

  IF v_role IS NULL THEN RETURN false; END IF;
  IF v_role = 'owner' THEN RETURN true; END IF;
  IF v_role = 'banned' THEN RETURN false; END IF;

  -- Get space overrides for this role
  SELECT role_permissions->v_role::text INTO v_perms
  FROM public.spaces
  WHERE id = p_space_id;

  RETURN (v_perms->>p_permission)::boolean IS TRUE;
END;
$$;
