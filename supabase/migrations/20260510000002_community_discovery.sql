-- Add category column to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS category text NULL;

-- Create an index for category filtering
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities (category) WHERE category IS NOT NULL;

-- Update search vector to include category
ALTER TABLE public.communities DROP COLUMN search_vector;
ALTER TABLE public.communities ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(name, '')        || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(slug, '')        || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS communities_search_vector_idx
  ON public.communities USING gin(search_vector);
