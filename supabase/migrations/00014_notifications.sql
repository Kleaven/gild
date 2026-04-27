-- ============================================================================
-- Migration 00014 — Notifications
-- In-app notifications. Append-only: notifications carry no updated_at,
-- and read-state changes are captured by the is_read boolean.
-- community_id is nullable so account-level notifications (e.g. password
-- reset) can be stored without a tenant.
-- ============================================================================

SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- notification_type enum
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'notification_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.notification_type AS ENUM (
      'new_comment',
      'new_post',
      'comment_reply',
      'course_enrolled',
      'course_completed',
      'certificate_issued',
      'membership_expiring',
      'membership_expired',
      'post_liked',
      'comment_liked'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  community_id uuid NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  type         public.notification_type NOT NULL,
  title        text NOT NULL CHECK (char_length(title) <= 200),
  body         text NULL CHECK (char_length(body) <= 500),
  resource_url text NULL, -- deep link to the relevant content
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_community
  ON public.notifications (community_id)
  WHERE community_id IS NOT NULL;
