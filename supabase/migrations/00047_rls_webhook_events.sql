-- ============================================================
-- Migration 00047: RLS policies — webhook_events
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

-- webhook_events_select
DROP POLICY IF EXISTS "webhook_events_select" ON public.webhook_events;
CREATE POLICY "webhook_events_select"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- webhook_events_insert
DROP POLICY IF EXISTS "webhook_events_insert" ON public.webhook_events;
CREATE POLICY "webhook_events_insert"
  ON public.webhook_events
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- webhook_events_update
DROP POLICY IF EXISTS "webhook_events_update" ON public.webhook_events;
CREATE POLICY "webhook_events_update"
  ON public.webhook_events
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- webhook_events_delete
DROP POLICY IF EXISTS "webhook_events_delete" ON public.webhook_events;
CREATE POLICY "webhook_events_delete"
  ON public.webhook_events
  FOR DELETE
  TO authenticated
  USING (is_platform_admin());
