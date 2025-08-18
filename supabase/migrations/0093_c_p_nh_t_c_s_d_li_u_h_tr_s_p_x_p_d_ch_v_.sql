-- Add a 'position' column to order services within a category
ALTER TABLE public.service_details ADD COLUMN IF NOT EXISTS position INTEGER;

-- Initialize the position for existing services based on their creation date
DO $$
DECLARE
    cat_id UUID;
BEGIN
    FOR cat_id IN SELECT id FROM public.service_categories LOOP
        UPDATE public.service_details sd
        SET position = s.row_num - 1
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
            FROM public.service_details
            WHERE category_id = cat_id
        ) s
        WHERE sd.id = s.id AND sd.category_id = cat_id;
    END LOOP;
END $$;