-- ============================================================================
-- Migration 00025 — Content RPCs
-- Soft-delete posts/comments and toggle votes. Each function performs its
-- own permission check before mutating, because SECURITY DEFINER bypasses
-- RLS and we cannot rely on RLS to gate these write paths.
--
-- A3 fix from the Step 12 review (approved):
--   delete_post and delete_comment now (1) raise immediately when
--   auth.uid() IS NULL, and (2) compare authorship with IS DISTINCT FROM
--   instead of !=. The original draft used `!= auth.uid()`, which silently
--   evaluates to NULL when either side is NULL — letting unauthenticated
--   callers, or any caller against a tombstoned-author post, slip past
--   the moderator check and into the UPDATE.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. delete_post — soft delete. Author or moderator+ only.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_post(
  p_post_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_post public.posts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] post not found';
  END IF;

  -- Author can delete own post; moderator+ can delete any post.
  -- IS DISTINCT FROM treats NULL as a real value, so a tombstoned-author
  -- post (author_id IS NULL) routes through the moderator check rather
  -- than slipping past on three-valued logic.
  IF v_post.author_id IS DISTINCT FROM auth.uid() THEN
    IF NOT public.user_has_min_role(v_post.community_id, 'moderator') THEN
      RAISE EXCEPTION '[gild] insufficient permissions to delete this post';
    END IF;
  END IF;

  UPDATE public.posts
  SET deleted_at = now()
  WHERE id = p_post_id AND deleted_at IS NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. delete_comment — soft delete + decrement parent post.comment_count.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_comment(
  p_comment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_comment public.comments;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[gild] comment not found';
  END IF;

  IF v_comment.author_id IS DISTINCT FROM auth.uid() THEN
    IF NOT public.user_has_min_role(v_comment.community_id, 'moderator') THEN
      RAISE EXCEPTION '[gild] insufficient permissions to delete this comment';
    END IF;
  END IF;

  UPDATE public.comments
  SET deleted_at = now()
  WHERE id = p_comment_id AND deleted_at IS NULL;

  -- Decrement parent post comment_count.
  UPDATE public.posts
  SET comment_count = GREATEST(comment_count - 1, 0)
  WHERE id = v_comment.post_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. toggle_vote — idempotent like/unlike. Returns true when the vote was
--    added, false when an existing vote was removed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_vote(
  p_target_type public.vote_target_type,
  p_target_id   uuid,
  p_community_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_voted   boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  IF NOT public.is_community_member(p_community_id) THEN
    RAISE EXCEPTION '[gild] must be a community member to vote';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.votes
    WHERE user_id     = v_user_id
      AND target_type = p_target_type
      AND target_id   = p_target_id
  ) THEN
    DELETE FROM public.votes
    WHERE user_id     = v_user_id
      AND target_type = p_target_type
      AND target_id   = p_target_id;

    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = p_target_id;
    END IF;

    v_voted := false;
  ELSE
    INSERT INTO public.votes (user_id, community_id, target_type, target_id)
    VALUES (v_user_id, p_community_id, p_target_type, p_target_id);

    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET like_count = like_count + 1
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET like_count = like_count + 1
      WHERE id = p_target_id;
    END IF;

    v_voted := true;
  END IF;

  RETURN v_voted;
END;
$$;
