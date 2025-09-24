-- Step 1: Add a new column to the report table to track when a comment was posted.
ALTER TABLE public."Bao_cao_Facebook"
ADD COLUMN IF NOT EXISTS commented_at TIMESTAMPTZ;

-- Step 2: Drop the existing function as required by PostgreSQL before changing its return type.
DROP FUNCTION IF EXISTS public.get_all_facebook_posts_for_internal_finder();

-- Step 3: Recreate the function to include the new 'commented_at' field in its results.
CREATE OR REPLACE FUNCTION public.get_all_facebook_posts_for_internal_finder()
 RETURNS TABLE(id uuid, campaign_id uuid, posted_at timestamp with time zone, keywords_found text[], ai_evaluation text, sentiment text, source_url text, scanned_at timestamp with time zone, description text, suggested_comment text, identified_service_id uuid, source_post_id text, commented_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_roles TEXT[];
  partner_user_ids UUID[];
BEGIN
  -- Get the roles of the current user
  SELECT array_agg(role_name) INTO user_roles FROM public.get_user_roles();

  -- If Super Admin or Manager, return all
  IF 'Super Admin' = ANY(user_roles) OR 'Quản lý' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id, f.commented_at
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE dsc.audience_type = 'internal';

  -- If Partner, return only their own data
  ELSIF 'Đối tác' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id, f.commented_at
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE f.user_id = auth.uid() AND dsc.audience_type = 'internal';

  -- Other roles (e.g., Collaborator)
  ELSE
    -- Get IDs of all users with the 'Partner' role
    SELECT array_agg(ur.user_id) INTO partner_user_ids
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE r.name = 'Đối tác';

    -- Return all data, EXCLUDING data from 'Partners'
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id, f.commented_at
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE (f.user_id IS NULL OR NOT (f.user_id = ANY(COALESCE(partner_user_ids, ARRAY[]::UUID[]))))
    AND dsc.audience_type = 'internal';
  END IF;
END;
$function$;