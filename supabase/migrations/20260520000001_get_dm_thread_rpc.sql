-- ============================================================================
-- Migration 20260520000001 — get_dm_thread RPC for index-walked thread reads
--
-- The existing app-layer query did:
--
--   SELECT * FROM direct_messages
--   WHERE (sender_id = $1 OR receiver_id = $1)  -- caller-side via RLS
--   AND   (sender_id.eq.X OR receiver_id.eq.X)  -- counterpart filter
--   ORDER BY created_at DESC LIMIT 50
--
-- PostgREST translates the `.or()` filter to a disjunction. Postgres cannot
-- push that disjunction into the pair-ordered compound index defined in
-- 20260517000002_direct_messages.sql:
--
--   idx_direct_messages_thread
--     ON public.direct_messages (
--       LEAST(sender_id, receiver_id),
--       GREATEST(sender_id, receiver_id),
--       created_at DESC
--     )
--
-- The planner ends up doing two index scans (one per direction) + sort,
-- or a heap scan with filter. Either way it walks more rows than necessary.
--
-- This RPC rewrites the query as a direct LEAST/GREATEST lookup that the
-- planner CAN turn into a single index-only walk. For a 1000-message thread
-- this is the difference between a ~50ms scan and a sub-millisecond seek.
--
-- Authorization: SECURITY INVOKER so RLS still applies. The caller must
-- still be one of the two parties — RLS on direct_messages.SELECT enforces
-- this independently of the RPC. The function adds no new privileges; it
-- only changes the query SHAPE so the index is usable.
-- ============================================================================

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_dm_thread(
  p_other_user_id uuid,
  p_limit         integer DEFAULT 50
)
RETURNS SETOF public.direct_messages
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.direct_messages
  WHERE LEAST(sender_id, receiver_id)
        = LEAST((SELECT public.current_user_id()), p_other_user_id)
    AND GREATEST(sender_id, receiver_id)
        = GREATEST((SELECT public.current_user_id()), p_other_user_id)
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$$;

REVOKE ALL ON FUNCTION public.get_dm_thread(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dm_thread(uuid, integer) TO authenticated;
