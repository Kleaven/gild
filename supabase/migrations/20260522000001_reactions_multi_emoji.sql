-- ============================================================================
-- Migration: Multi-emoji reactions
--
-- Extends the existing `votes` table from "one heart per user per target" to
-- "one row per (user, target, emoji)". Backward-compatible — existing rows
-- get '❤️' as the default emoji, and `posts.like_count` / `comments.like_count`
-- continue to mean "total reactions across all emojis" (no trigger change
-- needed; the toggle_vote RPC still increments/decrements those counters).
--
-- The toggle_vote RPC gains a `p_emoji` parameter (default '❤️' for callers
-- that haven't been updated yet). A new get_reactions_for_targets RPC
-- provides a single round-trip aggregate for feed/comment renders so we
-- avoid an N+1 per-target SELECT.
--
-- The CHECK constraint enforces the same 6-emoji whitelist that the server
-- action validates against. Adding a new emoji = new migration + app update.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- Schema change: add emoji column, swap UNIQUE constraint, add aggregation idx
-- ----------------------------------------------------------------------------

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '❤️';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'votes_emoji_whitelist_chk' AND conrelid = 'public.votes'::regclass
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_emoji_whitelist_chk
      CHECK (emoji IN ('❤️','👍','🎉','😂','😮','😢'));
  END IF;
END
$$;

ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_user_target_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'votes_user_target_emoji_key' AND conrelid = 'public.votes'::regclass
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_user_target_emoji_key
      UNIQUE (user_id, target_type, target_id, emoji);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_votes_target_emoji
  ON public.votes (target_type, target_id, emoji);

-- ----------------------------------------------------------------------------
-- toggle_vote v2 — now accepts an emoji. Backward-compatible signature via
-- default. Idempotent per (user, target, emoji): toggles a single emoji
-- reaction without touching the user's other emoji reactions on the same
-- target.
--
-- IMPORTANT: drop the legacy 3-arg overload first. Postgres treats different
-- argument lists as separate functions, so `CREATE OR REPLACE` of the 4-arg
-- variant would leave the old 3-arg version sitting alongside it — and
-- PostgREST cannot disambiguate two overloads with the same name when the
-- caller can match both. Same hazard the join_community migration hit at
-- 20260518000004.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.toggle_vote(public.vote_target_type, uuid, uuid);

CREATE OR REPLACE FUNCTION public.toggle_vote(
  p_target_type  public.vote_target_type,
  p_target_id    uuid,
  p_community_id uuid,
  p_emoji        text DEFAULT '❤️'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_added   boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[gild] not authenticated';
  END IF;

  IF NOT public.is_community_member(p_community_id) THEN
    RAISE EXCEPTION '[gild] must be a community member to vote';
  END IF;

  IF p_emoji NOT IN ('❤️','👍','🎉','😂','😮','😢') THEN
    RAISE EXCEPTION '[gild] unsupported reaction emoji';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.votes
    WHERE user_id     = v_user_id
      AND target_type = p_target_type
      AND target_id   = p_target_id
      AND emoji       = p_emoji
  ) THEN
    DELETE FROM public.votes
    WHERE user_id     = v_user_id
      AND target_type = p_target_type
      AND target_id   = p_target_id
      AND emoji       = p_emoji;

    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = p_target_id;
    END IF;

    v_added := false;
  ELSE
    INSERT INTO public.votes (user_id, community_id, target_type, target_id, emoji)
    VALUES (v_user_id, p_community_id, p_target_type, p_target_id, p_emoji);

    IF p_target_type = 'post' THEN
      UPDATE public.posts
      SET like_count = like_count + 1
      WHERE id = p_target_id;
    ELSE
      UPDATE public.comments
      SET like_count = like_count + 1
      WHERE id = p_target_id;
    END IF;

    v_added := true;
  END IF;

  RETURN v_added;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.toggle_vote(public.vote_target_type, uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.toggle_vote(public.vote_target_type, uuid, uuid, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- get_reactions_for_targets — single round-trip aggregator for feed renders.
-- Returns one row per (target, emoji) with the count and whether the calling
-- user reacted with that emoji. RLS on `votes` already restricts to community
-- members; SECURITY INVOKER preserves that.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reactions_for_targets(
  p_target_type public.vote_target_type,
  p_target_ids  uuid[]
)
RETURNS TABLE (
  target_id      uuid,
  emoji          text,
  count          bigint,
  viewer_reacted boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    v.target_id,
    v.emoji,
    COUNT(*)::bigint                                     AS count,
    BOOL_OR(v.user_id = auth.uid())                      AS viewer_reacted
  FROM public.votes v
  WHERE v.target_type = p_target_type
    AND v.target_id   = ANY(p_target_ids)
  GROUP BY v.target_id, v.emoji
  ORDER BY v.target_id, COUNT(*) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reactions_for_targets(public.vote_target_type, uuid[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_reactions_for_targets(public.vote_target_type, uuid[]) TO authenticated;
