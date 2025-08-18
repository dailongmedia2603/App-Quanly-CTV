-- Add a new column to store an array of image URLs
ALTER TABLE public.service_details ADD COLUMN pricing_image_urls TEXT[];

-- Migrate data from the old single-image column to the new array column
UPDATE public.service_details
SET pricing_image_urls = ARRAY[pricing_image_url]
WHERE pricing_image_url IS NOT NULL;

-- Remove the old single-image column
ALTER TABLE public.service_details DROP COLUMN pricing_image_url;