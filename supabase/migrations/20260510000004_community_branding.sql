-- Add theme_hue to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS theme_hue integer DEFAULT 250 CHECK (theme_hue BETWEEN 0 AND 360);

-- Update StudioSidebar and other components to use this hue
