-- Migration: Space Privileges
-- Adds a permissions JSONB column to allow granular control over who can post, comment, and react.

ALTER TABLE public.spaces
ADD COLUMN permissions JSONB NOT NULL DEFAULT '{ "post": "member", "comment": "member", "react": "member" }';

-- Add a check constraint to ensure the permissions follow the allowed roles if needed, 
-- but JSONB is flexible for now.

COMMENT ON COLUMN public.spaces.permissions IS 'Granular space-level permissions for actions like posting and commenting.';
