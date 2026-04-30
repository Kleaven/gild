-- ============================================================
-- Migration 00033: RLS policies — comments
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;

-- comments_select_public
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
CREATE POLICY "comments_select_public"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.spaces s ON s.id = p.space_id
      JOIN public.communities c ON c.id = s.community_id
      WHERE p.id = post_id
        AND c.is_private = false
        AND c.deleted_at IS NULL
    )
  );

-- comments_select_member
DROP POLICY IF EXISTS "comments_select_member" ON public.comments;
CREATE POLICY "comments_select_member"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (
    is_community_member(
      (SELECT s.community_id FROM public.spaces s
       JOIN public.posts p ON p.space_id = s.id
       WHERE p.id = post_id)
    )
  );

-- comments_insert
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    current_user_id() IS NOT NULL
    AND user_has_min_role(
      (SELECT s.community_id FROM public.spaces s
       JOIN public.posts p ON p.space_id = s.id
       WHERE p.id = post_id),
      'free_member'
    )
  );

-- comments_update
DROP POLICY IF EXISTS "comments_update" ON public.comments;
CREATE POLICY "comments_update"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    author_id = current_user_id()
    OR user_has_min_role(
      (SELECT s.community_id FROM public.spaces s
       JOIN public.posts p ON p.space_id = s.id
       WHERE p.id = post_id),
      'moderator'
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    author_id = current_user_id()
    OR user_has_min_role(
      (SELECT s.community_id FROM public.spaces s
       JOIN public.posts p ON p.space_id = s.id
       WHERE p.id = post_id),
      'moderator'
    )
    OR is_platform_admin()
  );

-- comments_delete
-- Direct DELETE locked to platform_admin only — delete_comment RPC
-- (SECURITY DEFINER) is the path for authors and moderators.
-- The RPC enforces soft-delete and audit-trail logic.
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
