-- ============================================================================
-- Migration 20260517000001 — Broadcast newsletter: unsubscribe + idempotency
--
-- Three additions that gate the broadcast feature for production:
--
-- 1. community_members.unsubscribe_token — per-member opaque token used in
--    List-Unsubscribe headers and one-click unsubscribe links. Generated once
--    at membership creation; never rotated (rotation would break already-sent
--    emails). UNIQUE so the token alone identifies the membership row.
--
-- 2. community_members.broadcast_opt_out — boolean filter applied at enqueue
--    time. Transactional mail (trial expiry, payment failed, course enrolled)
--    ignores this flag; only COMMUNITY_BROADCAST honours it.
--
-- 3. email_queue idempotency index — unique partial index on
--    (template, to_email, variables->>'postId') for broadcast rows. Paired
--    with INSERT … ON CONFLICT DO NOTHING in lib/feed/actions.ts so retries
--    silently dedupe instead of double-sending. Limited to pending|sent so
--    failed/cancelled rows can be re-queued manually.
-- ============================================================================

SET search_path = public, extensions;

-- ─── community_members: unsubscribe_token + broadcast_opt_out ────────────────

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS broadcast_opt_out boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_members_unsubscribe_token
  ON public.community_members (unsubscribe_token);

-- ─── email_queue: broadcast idempotency ──────────────────────────────────────
-- (variables->>'postId') is NULL for non-broadcast rows; the partial WHERE
-- clause restricts the unique constraint to broadcast rows with a postId.

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_broadcast_idempotent
  ON public.email_queue (
    template,
    to_email,
    (variables->>'postId')
  )
  WHERE template = 'COMMUNITY_BROADCAST'
    AND status IN ('pending', 'sent')
    AND (variables->>'postId') IS NOT NULL;

-- ─── set_broadcast_opt_out RPC ───────────────────────────────────────────────
-- Self-service opt-in/out for broadcast newsletters. RLS on community_members
-- restricts UPDATE to platform admins (intentional — role/tier changes are
-- privileged). This RPC opens a tightly-scoped self-update path for a single
-- column. SECURITY DEFINER + an explicit auth.uid() match prevent any cross-
-- user mutation even with a forged community_id.
CREATE OR REPLACE FUNCTION public.set_broadcast_opt_out(
  p_community_id uuid,
  p_opt_out      boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.community_members
     SET broadcast_opt_out = p_opt_out
   WHERE community_id = p_community_id
     AND user_id      = v_uid;

  -- Silent on no-rows: caller may not be a member of that community. No
  -- exception so a malicious caller can't enumerate memberships via timing.
END;
$$;

REVOKE ALL ON FUNCTION public.set_broadcast_opt_out(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_broadcast_opt_out(uuid, boolean) TO authenticated;
