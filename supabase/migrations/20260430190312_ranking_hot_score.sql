-- ============================================================================
-- Migration: Ranking & Hot Score
--
-- Implements Reddit-style logarithmic hot ranking with a 24-hour decay.
-- Includes optimized triggers and symmetric indexes for keyset pagination.
-- ============================================================================

SET search_path = public, extensions;

-- 1. Clean up existing objects to avoid return type conflicts
DROP TRIGGER IF EXISTS tr_posts_ranking ON public.posts;
DROP TRIGGER IF EXISTS tr_comments_ranking ON public.comments;
DROP FUNCTION IF EXISTS public.calculate_hot_score(integer, integer, timestamptz) CASCADE;

-- 2. Ensure hot_score columns exist as numeric
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hot_score numeric NOT NULL DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS hot_score numeric NOT NULL DEFAULT 0;

-- 3. Hot score calculation function
-- Using numeric to match existing column type and avoid overflow
CREATE OR REPLACE FUNCTION public.calculate_hot_score(
  p_likes      integer,
  p_comments   integer,
  p_created_at timestamptz
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_score      integer;
  v_order      numeric;
  v_seconds    numeric;
  v_epoch_base numeric := 1704067200; -- 2024-01-01 00:00:00 UTC
BEGIN
  v_score := p_likes + (p_comments * 2);
  v_order := log(10, GREATEST(ABS(v_score), 1));
  v_seconds := EXTRACT(EPOCH FROM p_created_at) - v_epoch_base;
  
  -- 86400 = 24 hours decay constant
  -- Rounded to 7 decimal places for stability
  RETURN ROUND((v_order + (v_seconds / 86400.0)), 7);
END;
$$;

-- 4. Trigger functions
CREATE OR REPLACE FUNCTION public.on_post_ranking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Optimization: Only recalculate if engagement or time changed
  IF (TG_OP = 'INSERT') OR
     (NEW.like_count IS DISTINCT FROM OLD.like_count) OR
     (NEW.comment_count IS DISTINCT FROM OLD.comment_count) OR
     (NEW.created_at IS DISTINCT FROM OLD.created_at) 
  THEN
    NEW.hot_score := public.calculate_hot_score(NEW.like_count, NEW.comment_count, NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_comment_ranking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (NEW.like_count IS DISTINCT FROM OLD.like_count) OR
     (NEW.created_at IS DISTINCT FROM OLD.created_at)
  THEN
    NEW.hot_score := public.calculate_hot_score(NEW.like_count, 0, NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Create Triggers
CREATE TRIGGER tr_posts_ranking
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_post_ranking_update();

CREATE TRIGGER tr_comments_ranking
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_comment_ranking_update();

-- 6. Indexes for symmetric keyset pagination (O(log n))
-- Mirroring order by hot_score DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_posts_hot_pagination
  ON public.posts (community_id, hot_score DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_hot_pagination
  ON public.comments (post_id, hot_score DESC, id DESC)
  WHERE deleted_at IS NULL;

-- 7. Indexes for "Top" and "New" feeds
-- Top: community_id, created_at (for time filtering), like_count DESC
CREATE INDEX IF NOT EXISTS idx_posts_top_ranking
  ON public.posts (community_id, created_at, like_count DESC)
  WHERE deleted_at IS NULL;

-- 8. Backfill existing rows
UPDATE public.posts SET hot_score = public.calculate_hot_score(like_count, comment_count, created_at);
UPDATE public.comments SET hot_score = public.calculate_hot_score(like_count, 0, created_at);
