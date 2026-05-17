-- ============================================================================
-- Migration 20260517000002 — Gild Chat: 1-on-1 direct messages
--
-- Two-party messaging gated by shared community membership. Tenancy boundary
-- is the (sender_id, receiver_id) pair plus an EXISTS check that both parties
-- are non-banned members of at least one common community — there's no
-- per-community partition for DMs, but you can't strike up a conversation
-- with somebody you've never shared a room with.
--
-- Notes on policy shape:
--   • SELECT/INSERT predicates wrap current_user_id() in a SELECT subquery so
--     Postgres caches the call once per statement instead of re-invoking the
--     STABLE SECURITY DEFINER function per row. Standard Supabase guidance.
--   • SELECT on community_members already gates by is_community_member(),
--     so the EXISTS subquery in the INSERT WITH CHECK is safe from RLS-block:
--     the sender is querying rows for communities they themselves belong to.
--   • Replica identity FULL is required for realtime DELETE/UPDATE payloads
--     to carry full row content. INSERT payloads work with DEFAULT, but we
--     set FULL up-front so read_at-update broadcasts have the old/new state.
-- ============================================================================

SET search_path = public, extensions;

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 3000),
  read_at     timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_messages_no_self CHECK (sender_id <> receiver_id)
);

ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Per-direction lookups for unread counts, sent-by-me feeds.
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender
  ON public.direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver
  ON public.direct_messages (receiver_id, created_at DESC);

-- Pair-ordered compound index — the conversation lookup walks by
-- (LEAST(sender, receiver), GREATEST(sender, receiver), created_at DESC)
-- so a single index serves both directions of the same thread.
CREATE INDEX IF NOT EXISTS idx_direct_messages_thread
  ON public.direct_messages (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
  );

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages FORCE ROW LEVEL SECURITY;

-- SELECT: caller must be one of the two parties.
DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages;
CREATE POLICY "direct_messages_select"
  ON public.direct_messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.current_user_id()) = sender_id
    OR (SELECT public.current_user_id()) = receiver_id
  );

-- INSERT: caller must be the sender AND share at least one community with
-- the receiver where neither party is banned. The EXISTS subquery returns
-- the count of common non-banned memberships; we just need >= 1.
DROP POLICY IF EXISTS "direct_messages_insert" ON public.direct_messages;
CREATE POLICY "direct_messages_insert"
  ON public.direct_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.current_user_id()) = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.community_members cm_sender
      JOIN public.community_members cm_receiver
        ON cm_sender.community_id = cm_receiver.community_id
      WHERE cm_sender.user_id = sender_id
        AND cm_receiver.user_id = receiver_id
        AND cm_sender.role <> 'banned'
        AND cm_receiver.role <> 'banned'
    )
  );

-- UPDATE: only the receiver can mark a message read (sets read_at).
-- USING gates which rows the policy applies to; WITH CHECK ensures the
-- updated row still satisfies the predicate. Restricting WITH CHECK to
-- the same predicate as USING blocks receivers from reassigning ownership
-- of a message via UPDATE.
DROP POLICY IF EXISTS "direct_messages_update" ON public.direct_messages;
CREATE POLICY "direct_messages_update"
  ON public.direct_messages
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.current_user_id()) = receiver_id)
  WITH CHECK ((SELECT public.current_user_id()) = receiver_id);

-- DELETE: senders can retract their own messages. (Receivers cannot delete
-- messages received from someone else — that would let them rewrite a
-- conversation from their counterpart's perspective.)
DROP POLICY IF EXISTS "direct_messages_delete" ON public.direct_messages;
CREATE POLICY "direct_messages_delete"
  ON public.direct_messages
  FOR DELETE
  TO authenticated
  USING ((SELECT public.current_user_id()) = sender_id);

-- ─── Realtime publication ────────────────────────────────────────────────────
-- Conditional add — pg_publication_tables doesn't enforce uniqueness, so we
-- guard manually to keep this migration idempotent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END
$$;
