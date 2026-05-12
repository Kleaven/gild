-- Add image_url to courses and lessons
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS image_url text;

-- Add attachment_urls to lessons for supplementary materials
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS attachment_urls text[] DEFAULT '{}';
