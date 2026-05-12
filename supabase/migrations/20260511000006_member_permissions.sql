-- Migration: Member Permissions
-- Adds a permissions JSONB column to community_members to store granular admin/moderator overrides.

ALTER TABLE public.community_members
ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.community_members.permissions IS 'Granular role-based permission overrides for specific members (e.g., specific admin capabilities).';
