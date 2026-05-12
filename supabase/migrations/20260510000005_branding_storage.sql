-- Create branding bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for branding
CREATE POLICY "Public branding assets are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "Owners can upload branding assets for their community"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can update their own branding assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'branding' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
