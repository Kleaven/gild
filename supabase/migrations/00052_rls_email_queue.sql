-- ============================================================
-- Migration 00052: RLS policies — email_queue
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue FORCE ROW LEVEL SECURITY;

-- email_queue_select
DROP POLICY IF EXISTS "email_queue_select" ON public.email_queue;
CREATE POLICY "email_queue_select"
  ON public.email_queue
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- email_queue_insert
DROP POLICY IF EXISTS "email_queue_insert" ON public.email_queue;
CREATE POLICY "email_queue_insert"
  ON public.email_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- email_queue_update
DROP POLICY IF EXISTS "email_queue_update" ON public.email_queue;
CREATE POLICY "email_queue_update"
  ON public.email_queue
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- email_queue_delete
DROP POLICY IF EXISTS "email_queue_delete" ON public.email_queue;
CREATE POLICY "email_queue_delete"
  ON public.email_queue
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
