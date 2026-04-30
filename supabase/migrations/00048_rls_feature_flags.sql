-- ============================================================
-- Migration 00048: RLS policies — feature_flags
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;

-- feature_flags_select
-- All authenticated users can read flags — required for client-side
-- feature gating. community_id is nullable; both global and per-community
-- rows are readable.
DROP POLICY IF EXISTS "feature_flags_select" ON public.feature_flags;
CREATE POLICY "feature_flags_select"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- feature_flags_insert
DROP POLICY IF EXISTS "feature_flags_insert" ON public.feature_flags;
CREATE POLICY "feature_flags_insert"
  ON public.feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- feature_flags_update
DROP POLICY IF EXISTS "feature_flags_update" ON public.feature_flags;
CREATE POLICY "feature_flags_update"
  ON public.feature_flags
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- feature_flags_delete
DROP POLICY IF EXISTS "feature_flags_delete" ON public.feature_flags;
CREATE POLICY "feature_flags_delete"
  ON public.feature_flags
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
