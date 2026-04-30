-- ============================================================
-- Migration 00032: RLS policies — posts
--
-- posts has no direct community_id column. Community context is
-- resolved via the inline subquery
--   (SELECT community_id FROM public.spaces WHERE id = space_id)
-- spaces.id is a primary key and is indexed, so this resolves to a
-- single index-scan per row.
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;

-- posts_select
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    is_community_member((SELECT community_id FROM public.spaces WHERE id = space_id))
    OR is_platform_admin()
  );

-- posts_insert
-- free_member is the lowest non-banned role; banned users fail
-- user_has_min_role and so cannot post.
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    current_user_id() IS NOT NULL
    AND user_has_min_role(
      (SELECT community_id FROM public.spaces WHERE id = space_id),
      'free_member'
    )
  );

-- posts_update
-- No UPDATE RPC exists for posts, so direct DML is the correct path
-- for authors and moderators. Authors edit their own posts; moderator+
-- can edit any post in their community.
DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (
    author_id = current_user_id()
    OR user_has_min_role((SELECT community_id FROM public.spaces WHERE id = space_id), 'moderator')
    OR is_platform_admin()
  )
  WITH CHECK (
    author_id = current_user_id()
    OR user_has_min_role((SELECT community_id FROM public.spaces WHERE id = space_id), 'moderator')
    OR is_platform_admin()
  );

-- posts_delete
-- Direct DELETE locked to platform_admin only — delete_post RPC
-- (SECURITY DEFINER) is the path for authors and moderators. The RPC
-- enforces soft-delete and audit-trail logic; allowing direct hard
-- DELETE here would bypass both.
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
