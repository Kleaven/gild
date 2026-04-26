-- ============================================================================
-- Migration 00000 — Extensions and schemas
-- Foundation for every later migration. Pure SQL, fully idempotent: re-running
-- this file against an already-migrated database must be a no-op.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Custom schemas
-- ----------------------------------------------------------------------------
-- The `extensions` schema isolates extension-owned objects (functions,
-- operators, types) from `public`. Keeps user-defined tables uncluttered and
-- makes ownership and grants easier to reason about. `public` is managed by
-- Supabase and is intentionally not recreated here.
CREATE SCHEMA IF NOT EXISTS extensions;

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------

-- uuid-ossp: uuid_generate_v4() and friends. Default primary-key generator
-- for every table introduced in later migrations.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- pgcrypto: HMAC, digest, gen_random_bytes, crypt. Used for webhook signature
-- verification (Stripe at Step 40) and any password-adjacent cryptography.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- pg_trgm: trigram similarity operators and GIN/GIST index support. Powers
-- fuzzy matching and ILIKE acceleration alongside tsvector search (Step 14).
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- unaccent: strips diacritics so search treats "café" and "cafe" alike.
-- Wired into the tsvector text-search configuration in migration 00061.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- pg_stat_statements: query performance telemetry. Supabase enables this at
-- the cluster level by default; IF NOT EXISTS keeps this idempotent and
-- prevents drift if it is ever disabled upstream.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- Default search path
-- ----------------------------------------------------------------------------
-- New sessions resolve unqualified identifiers against `public` first, then
-- `extensions`. Lets calls like uuid_generate_v4() resolve without a schema
-- prefix while keeping user objects under `public`. ALTER DATABASE persists
-- the setting; existing sessions pick it up on reconnect.
ALTER DATABASE postgres SET search_path TO public, extensions;
