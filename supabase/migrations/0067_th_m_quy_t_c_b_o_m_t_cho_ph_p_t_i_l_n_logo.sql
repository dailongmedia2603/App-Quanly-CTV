-- Create a policy to allow authenticated users to upload files to the 'quote_assets' bucket.
CREATE POLICY "Allow authenticated uploads to quote_assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quote_assets');