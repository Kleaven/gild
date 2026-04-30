-- ============================================================
-- Migration 00053: tsvector search columns and GIN indexes
-- Adds a GENERATED ALWAYS AS STORED tsvector column to the four
-- primary searchable tables. Config 'simple' is used throughout
-- so search behaviour is locale-neutral and predictable.
-- DO blocks guard each ADD COLUMN for idempotency.
-- ============================================================
SET search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- profiles
-- Searchable: display_name, bio, username
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(display_name, '') || ' ' ||
          coalesce(bio, '')          || ' ' ||
          coalesce(username, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_search_vector_idx
  ON public.profiles USING gin(search_vector);

-- ----------------------------------------------------------------------------
-- communities
-- Searchable: name, description, slug
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(name, '')        || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce(slug, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS communities_search_vector_idx
  ON public.communities USING gin(search_vector);

-- ----------------------------------------------------------------------------
-- posts
-- Searchable: title, body
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(title, '') || ' ' ||
          coalesce(body, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS posts_search_vector_idx
  ON public.posts USING gin(search_vector);

-- ----------------------------------------------------------------------------
-- courses
-- Searchable: title, description
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(title, '')       || ' ' ||
          coalesce(description, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS courses_search_vector_idx
  ON public.courses USING gin(search_vector);
