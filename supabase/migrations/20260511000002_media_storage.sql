-- Create media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for media
CREATE POLICY "Public media assets are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can upload media assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own media assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable RLS on media table
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- media table policies
CREATE POLICY "Public media rows are viewable by everyone"
  ON public.media FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own media rows"
  ON public.media FOR INSERT
  WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Users can update their own media rows"
  ON public.media FOR UPDATE
  USING (uploader_id = auth.uid());

