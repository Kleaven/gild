-- ============================================================================
-- Migration 00022 — app_auth helper functions
--
-- Six pure-SQL helpers used by every RLS policy in Steps 12 and 13. Every
-- function is:
--   SECURITY DEFINER — runs with the migration owner's privileges so a
--                      caller (RLS policy) can read tables the calling
--                      role itself may not be allowed to touch directly.
--                      In particular, RLS on community_members is set up
--                      so that members can only see their own community's
--                      rows; the role-hierarchy helper still needs to
--                      consult community_members across the whole table to
--                      answer "is the current user an admin of X?".
--
--   STABLE             — reads only. Lets the planner cache the result
--                      within a single statement and lets RLS subqueries
--                      inline efficiently.
--
--   SET search_path =  — pins the function's search_path so a malicious
--   public, extensions   caller cannot prepend a schema with a shadowed
--                      auth.uid() or community_members table and trick a
--                      DEFINER-elevated function into reading attacker
--                      data. This is the canonical Postgres mitigation
--                      for the SECURITY DEFINER search-path hijack.
--
-- Pure SQL only (LANGUAGE sql). CREATE OR REPLACE for idempotency.
-- No tables, no RLS, no triggers in this migration.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. current_user_id — stable public-schema wrapper around auth.uid().
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- 2. current_user_role — the calling user's role in a given community,
--                       or NULL if they are not a member.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role(p_community_id uuid)
RETURNS public.member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT role
  FROM public.community_members
  WHERE community_id = p_community_id
    AND user_id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- 3. user_has_min_role — true when the calling user's role in the given
--                       community is at or above p_min_role. The CASE
--                       expands the privilege ladder; lower-privilege
--                       arrays are supersets of higher-privilege arrays.
--                       'banned' deliberately matches no level — banned
--                       users return false for every minimum role check.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_min_role(
  p_community_id uuid,
  p_min_role     public.member_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND role::text = ANY (
        CASE p_min_role
          WHEN 'owner'        THEN ARRAY['owner']
          WHEN 'admin'        THEN ARRAY['owner','admin']
          WHEN 'moderator'    THEN ARRAY['owner','admin','moderator']
          WHEN 'tier2_member' THEN ARRAY['owner','admin','moderator','tier2_member']
          WHEN 'tier1_member' THEN ARRAY['owner','admin','moderator','tier2_member','tier1_member']
          WHEN 'free_member'  THEN ARRAY['owner','admin','moderator','tier2_member','tier1_member','free_member']
          ELSE ARRAY[]::text[]
        END
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- 4. is_community_owner — shorthand for owner-only RLS predicates.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_community_owner(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.communities
    WHERE id = p_community_id
      AND owner_id = auth.uid()
  )
$$;

-- ----------------------------------------------------------------------------
-- 5. is_platform_admin — true when the calling Supabase auth user is on
--                       the platform allow-list (00019).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = auth.uid()
  )
$$;

-- ----------------------------------------------------------------------------
-- 6. is_community_member — true when the calling user has any non-banned
--                         membership row for the community.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND role <> 'banned'
  )
$$;
