-- ============================================================================
-- Migration 20260518000004 — Drop legacy 1-arg join_community overload
--
-- The original join_community(p_community_id uuid) RPC shipped in
-- 00024_member_rpcs.sql. A later migration (20260511000011_shared_invite_links)
-- added a 2-arg variant: join_community(p_community_id uuid, p_invite_token text
-- DEFAULT NULL). PostgreSQL allows overloads by arity, so both ended up
-- coexisting in the DB.
--
-- When PostgREST receives a call with only `p_community_id` set, both
-- overloads match (the 2-arg version via its DEFAULT NULL). PG raises:
--
--   Could not choose the best candidate function between:
--     public.join_community(p_community_id => uuid),
--     public.join_community(p_community_id => uuid, p_invite_token => text)
--
-- The 2-arg version is the canonical one — it handles both paths (with
-- and without an invite token) via the parameter default. The 1-arg
-- version is dead code that should have been dropped when the shared-
-- invite-links migration superseded it.
--
-- DROP FUNCTION IF EXISTS — idempotent, safe to re-run.
-- ============================================================================

SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.join_community(uuid);
