-- ============================================================================
-- Migration 20260518000002 — Backfill communities.owner_id from
-- community_members where the two ownership tracks have drifted.
--
-- Why this exists:
--   communities.owner_id is the authoritative ownership column (it's what
--   the is_community_owner() RPC reads and what the RLS policy on
--   communities.UPDATE checks). community_members.role = 'owner' is a
--   convenience row in the membership table — it should always match
--   owner_id, but historical communities created via earlier RPC versions
--   may have one set but not the other, OR the columns may have been
--   manually edited out of sync. When they disagree, the UPDATE that
--   underpins deleteCommunity / updateCommunity fails RLS with a
--   confusing 500 even though the app-layer role check passes.
--
-- What this does:
--   For every community row where owner_id is NULL or doesn't match the
--   user_id of the community_members row with role='owner', set owner_id
--   to that user_id. Idempotent: re-running changes nothing once aligned.
--
-- Safety:
--   - Only writes when there's a concrete `community_members` row with
--     role='owner' to copy from.
--   - If somehow a community has multiple owner rows (no UNIQUE enforces
--     single ownership in the schema), picks the earliest-joined one.
--   - Wrapped in a BEGIN/COMMIT block so any partial failure rolls back.
-- ============================================================================

SET search_path = public, extensions;

DO $$
DECLARE
  v_fixed integer;
BEGIN
  -- Subquery picks the earliest owner row per community in case of dupes.
  WITH primary_owners AS (
    SELECT DISTINCT ON (community_id)
      community_id,
      user_id
    FROM public.community_members
    WHERE role = 'owner'
    ORDER BY community_id, joined_at ASC
  )
  UPDATE public.communities c
     SET owner_id = po.user_id
    FROM primary_owners po
   WHERE po.community_id = c.id
     AND c.owner_id IS DISTINCT FROM po.user_id;

  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE '[backfill] re-aligned owner_id on % community row(s)', v_fixed;
END
$$;
