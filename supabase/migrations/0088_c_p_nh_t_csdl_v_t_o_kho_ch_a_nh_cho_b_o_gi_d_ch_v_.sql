-- Add a new column to the service_details table to store the image URL
ALTER TABLE public.service_details
ADD COLUMN pricing_image_url TEXT;

-- Create a new public Storage bucket named 'service_pricing_images'
-- This is done by inserting into the storage.buckets table.
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_pricing_images', 'service_pricing_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create security policies for the new bucket
-- Allow anyone to view images in the bucket
CREATE POLICY "Allow public read access to pricing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service_pricing_images');

-- Allow only Super Admins to upload new images
CREATE POLICY "Allow Super Admins to upload pricing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service_pricing_images' AND
  'Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))
);

-- Allow only Super Admins to update images
CREATE POLICY "Allow Super Admins to update pricing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service_pricing_images' AND
  'Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))
);

-- Allow only Super Admins to delete images
CREATE POLICY "Allow Super Admins to delete pricing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service_pricing_images' AND
  'Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))
);