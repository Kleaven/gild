-- ============================================================================
-- Migration 20260627000001 — Custom domains (Pro feature)
-- Lets a Pro community map its own domain (e.g. community.creator.com) to its
-- Gild community. The domain is registered with the hosting provider (Vercel)
-- for SSL, verified via DNS, then served by host-based rewrite in middleware.
--
-- status lifecycle:
--   NULL     → no custom domain set
--   'pending'→ domain added + awaiting DNS / SSL verification
--   'active' → verified; middleware serves the community on this host
--   'error'  → verification failed or domain misconfigured
-- ============================================================================

SET search_path = public, extensions;

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE NULL
    CHECK (custom_domain IS NULL OR custom_domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  ADD COLUMN IF NOT EXISTS custom_domain_status text NULL
    CHECK (custom_domain_status IS NULL OR custom_domain_status IN ('pending', 'active', 'error'));

-- Partial index: only the (few) rows that actually set a domain are indexed.
CREATE INDEX IF NOT EXISTS idx_communities_custom_domain
  ON public.communities (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- ── resolve_custom_domain ────────────────────────────────────────────────────
-- SECURITY DEFINER so the edge middleware can resolve a host → community slug
-- for anonymous visitors without tripping RLS. Returns the slug ONLY for an
-- 'active' domain; pending/error domains resolve to NULL (not yet live).
CREATE OR REPLACE FUNCTION public.resolve_custom_domain(p_domain text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
STABLE
AS $$
  SELECT slug
  FROM public.communities
  WHERE custom_domain = lower(p_domain)
    AND custom_domain_status = 'active'
    AND deleted_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_custom_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_custom_domain(text) TO anon, authenticated, service_role;
