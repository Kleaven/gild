-- Add KYC columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persona text CHECK (persona IN ('member', 'owner'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;

-- Index for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_persona ON public.profiles (persona) WHERE persona IS NOT NULL;
