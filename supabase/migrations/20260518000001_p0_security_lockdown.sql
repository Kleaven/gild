-- ============================================================================
-- Migration 20260518000001 — P0 security lockdown
--
-- Closes three pre-launch multi-tenant RLS gaps surfaced in the 2026-05-18
-- audit. All policies are idempotent (DROP POLICY IF EXISTS / CREATE) so
-- the migration is safe to re-run after a hot-fix.
--
-- All current_user_id() calls are wrapped in (SELECT …) subqueries so
-- Postgres caches the STABLE SECURITY DEFINER lookup once per statement
-- instead of re-invoking per row — standard Supabase RLS optimisation.
-- ============================================================================

SET search_path = public, extensions;

-- ─── 1. poll_votes: previously NO RLS at all ────────────────────────────────
-- Before this migration any signed-in user could SELECT/INSERT/UPDATE/DELETE
-- (or TRUNCATE) every poll vote on the platform. Tenancy boundary is the
-- parent post's community.

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;
CREATE POLICY "poll_votes_select"
  ON public.poll_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = poll_votes.post_id
        AND public.is_community_member(p.community_id)
    )
  );

DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
CREATE POLICY "poll_votes_insert"
  ON public.poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT public.current_user_id())
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = poll_votes.post_id
        AND public.is_community_member(p.community_id)
    )
  );

DROP POLICY IF EXISTS "poll_votes_update" ON public.poll_votes;
CREATE POLICY "poll_votes_update"
  ON public.poll_votes
  FOR UPDATE
  TO authenticated
  USING      (user_id = (SELECT public.current_user_id()))
  WITH CHECK (user_id = (SELECT public.current_user_id()));

DROP POLICY IF EXISTS "poll_votes_delete" ON public.poll_votes;
CREATE POLICY "poll_votes_delete"
  ON public.poll_votes
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT public.current_user_id()));

-- ─── 2. community_invite_links: previously NO RLS at all ────────────────────
-- The `token` column is the join secret. Browseable globally without RLS.
-- Restrict every operation to community admins/owners and platform admins.
-- Token-based redemption is handled by a SECURITY DEFINER RPC, not direct
-- table access, so authenticated members never need SELECT here.

ALTER TABLE public.community_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invite_links FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_links_select" ON public.community_invite_links;
CREATE POLICY "invite_links_select"
  ON public.community_invite_links
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_min_role(community_id, 'admin')
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "invite_links_insert" ON public.community_invite_links;
CREATE POLICY "invite_links_insert"
  ON public.community_invite_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = (SELECT public.current_user_id())
    AND (
      public.user_has_min_role(community_id, 'admin')
      OR public.is_platform_admin()
    )
  );

DROP POLICY IF EXISTS "invite_links_update" ON public.community_invite_links;
CREATE POLICY "invite_links_update"
  ON public.community_invite_links
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_min_role(community_id, 'admin')
    OR public.is_platform_admin()
  )
  WITH CHECK (
    public.user_has_min_role(community_id, 'admin')
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "invite_links_delete" ON public.community_invite_links;
CREATE POLICY "invite_links_delete"
  ON public.community_invite_links
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_min_role(community_id, 'admin')
    OR public.is_platform_admin()
  );

-- ─── 3. public.media: SELECT was USING (true) — full global read ────────────
-- Force RLS so service_role is the only bypass (instead of any
-- table-owner connection), drop the open-read policy, and re-create
-- SELECT scoped to (a) the uploader, or (b) members of the community
-- the asset belongs to.

ALTER TABLE public.media FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public media rows are viewable by everyone" ON public.media;
DROP POLICY IF EXISTS "media_select" ON public.media;
CREATE POLICY "media_select"
  ON public.media
  FOR SELECT
  TO authenticated
  USING (
    uploader_id = (SELECT public.current_user_id())
    OR (
      community_id IS NOT NULL
      AND public.is_community_member(community_id)
    )
  );
