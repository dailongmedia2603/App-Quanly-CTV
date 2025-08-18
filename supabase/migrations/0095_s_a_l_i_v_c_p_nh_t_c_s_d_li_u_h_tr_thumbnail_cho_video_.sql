-- Add thumbnail_url column to video_guides table
ALTER TABLE public.video_guides
ADD COLUMN thumbnail_url TEXT;

-- Create a new bucket for guide thumbnails if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('guide_thumbnails', 'guide_thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the new bucket
-- Allow public read access to thumbnails
CREATE POLICY "Allow public read on guide thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'guide_thumbnails');

-- Allow Super Admins to upload, update, and delete thumbnails
CREATE POLICY "Allow super admins to manage guide thumbnails"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK (
  bucket_id = 'guide_thumbnails' AND
  ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
);