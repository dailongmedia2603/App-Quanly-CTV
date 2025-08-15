-- Drop the function that depends on the tables to be deleted
DROP FUNCTION IF EXISTS public.get_all_facebook_posts_for_finder();

-- Drop the unused report tables
DROP TABLE IF EXISTS public."Bao_cao_tong_hop";
DROP TABLE IF EXISTS public."Bao_cao_Website";

-- Recreate the function to only use the main Facebook report table
CREATE OR REPLACE FUNCTION get_all_facebook_posts_for_finder()
RETURNS TABLE (
    id uuid,
    campaign_id uuid,
    posted_at timestamptz,
    keywords_found text[],
    ai_evaluation text,
    sentiment text,
    source_url text,
    scanned_at timestamptz,
    description text,
    suggested_comment text,
    identified_service_id uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    campaign_id,
    posted_at,
    keywords_found,
    ai_evaluation,
    sentiment,
    source_url,
    scanned_at,
    content AS description, -- Alias content to description for consistency
    suggested_comment,
    identified_service_id
  FROM public."Bao_cao_Facebook";
$$;