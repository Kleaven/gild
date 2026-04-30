-- ============================================================
-- Migration 00044: RLS policies — notifications
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- notifications_select
-- Users see only their own notifications.
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id());

-- notifications_insert
-- Locked to platform_admin only — notifications are created server-side
-- by triggers and RPCs, never by direct client DML.
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- notifications_update
-- Users can update their own notifications (e.g. mark as read).
-- Platform admins have full access.
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id() OR is_platform_admin())
  WITH CHECK (user_id = current_user_id() OR is_platform_admin());

-- notifications_delete
-- Users can delete their own notifications. Platform admins have full access.
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id() OR is_platform_admin());
