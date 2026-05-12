-- Add allow_member_posts to spaces
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS allow_member_posts boolean NOT NULL DEFAULT true;

-- Add media_urls to posts for images/attachments
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls text[] NULL;
