-- ============================================================================
-- Migration: P2 security audit — close RLS gaps on community_invite_links
-- and poll_votes
--
-- Both tables shipped without ALTER ... ENABLE ROW LEVEL SECURITY. Result:
-- any authenticated user could SELECT every community's invite tokens
-- (mass-join attack vector) or read all poll vote data across the platform.
--
-- Policies below mirror the patterns established at 00027-00052 for the
-- rest of the schema: SELECT scoped to community members, INSERT/UPDATE/
-- DELETE scoped to the row owner.
-- ============================================================================

SET search_path = public, extensions;

-- ─── community_invite_links ───────────────────────────────────────────────

ALTER TABLE public.community_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invite_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invite_links_select ON public.community_invite_links;
CREATE POLICY invite_links_select ON public.community_invite_links
  FOR SELECT
  USING (
    -- Members of the community (any role except banned) can list links.
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_invite_links.community_id
        AND cm.user_id      = auth.uid()
        AND cm.role        <> 'banned'
    )
  );

DROP POLICY IF EXISTS invite_links_insert ON public.community_invite_links;
CREATE POLICY invite_links_insert ON public.community_invite_links
  FOR INSERT
  WITH CHECK (
    -- Only owner / admin / moderator can create invite links.
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_invite_links.community_id
        AND cm.user_id      = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS invite_links_update ON public.community_invite_links;
CREATE POLICY invite_links_update ON public.community_invite_links
  FOR UPDATE
  USING (
    -- Owner / admin / moderator of the community.
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_invite_links.community_id
        AND cm.user_id      = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS invite_links_delete ON public.community_invite_links;
CREATE POLICY invite_links_delete ON public.community_invite_links
  FOR DELETE
  USING (
    -- Owner / admin / moderator of the community.
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_invite_links.community_id
        AND cm.user_id      = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Token-by-token redemption (the join-via-link flow) goes through the
-- redeem_invite_link RPC which is SECURITY DEFINER — it does not need a
-- public SELECT policy and is intentionally guarded by the RPC.

-- ─── poll_votes ────────────────────────────────────────────────────────────

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poll_votes_select ON public.poll_votes;
CREATE POLICY poll_votes_select ON public.poll_votes
  FOR SELECT
  USING (
    -- A user can see all poll_votes for a post if they are a community
    -- member of the post's community. Joins through posts to resolve.
    EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.community_members cm
        ON cm.community_id = p.community_id
       AND cm.user_id      = auth.uid()
       AND cm.role        <> 'banned'
      WHERE p.id = poll_votes.post_id
    )
  );

DROP POLICY IF EXISTS poll_votes_insert ON public.poll_votes;
CREATE POLICY poll_votes_insert ON public.poll_votes
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.community_members cm
        ON cm.community_id = p.community_id
       AND cm.user_id      = auth.uid()
       AND cm.role        <> 'banned'
      WHERE p.id = poll_votes.post_id
    )
  );

DROP POLICY IF EXISTS poll_votes_update ON public.poll_votes;
CREATE POLICY poll_votes_update ON public.poll_votes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS poll_votes_delete ON public.poll_votes;
CREATE POLICY poll_votes_delete ON public.poll_votes
  FOR DELETE
  USING (user_id = auth.uid());
