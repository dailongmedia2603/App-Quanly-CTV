DROP FUNCTION IF EXISTS public.get_all_facebook_posts_for_finder();
CREATE OR REPLACE FUNCTION public.get_all_facebook_posts_for_finder()
 RETURNS TABLE(id uuid, campaign_id uuid, posted_at timestamp with time zone, keywords_found text[], ai_evaluation text, sentiment text, source_url text, scanned_at timestamp with time zone, description text, suggested_comment text, identified_service_id uuid, source_post_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_roles TEXT[];
  partner_user_ids UUID[];
BEGIN
  -- Lấy danh sách vai trò của người dùng hiện tại
  SELECT array_agg(role_name) INTO user_roles FROM public.get_user_roles();

  -- Nếu là Super Admin hoặc Quản lý, trả về tất cả
  IF 'Super Admin' = ANY(user_roles) OR 'Quản lý' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE dsc.audience_type = 'collaborator';

  -- Nếu là Đối tác, chỉ trả về dữ liệu của chính họ
  ELSIF 'Đối tác' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE f.user_id = auth.uid() AND dsc.audience_type = 'collaborator';

  -- Các vai trò khác (ví dụ: Cộng tác viên)
  ELSE
    -- Lấy ID của tất cả người dùng có vai trò 'Đối tác'
    SELECT array_agg(ur.user_id) INTO partner_user_ids
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE r.name = 'Đối tác';

    -- Trả về tất cả dữ liệu, NGOẠI TRỪ dữ liệu của các 'Đối tác'
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE (f.user_id IS NULL OR NOT (f.user_id = ANY(COALESCE(partner_user_ids, ARRAY[]::UUID[]))))
    AND dsc.audience_type = 'collaborator';
  END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_all_facebook_posts_for_internal_finder();
CREATE OR REPLACE FUNCTION public.get_all_facebook_posts_for_internal_finder()
 RETURNS TABLE(id uuid, campaign_id uuid, posted_at timestamp with time zone, keywords_found text[], ai_evaluation text, sentiment text, source_url text, scanned_at timestamp with time zone, description text, suggested_comment text, identified_service_id uuid, source_post_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_roles TEXT[];
  partner_user_ids UUID[];
BEGIN
  -- Lấy danh sách vai trò của người dùng hiện tại
  SELECT array_agg(role_name) INTO user_roles FROM public.get_user_roles();

  -- Nếu là Super Admin hoặc Quản lý, trả về tất cả
  IF 'Super Admin' = ANY(user_roles) OR 'Quản lý' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE dsc.audience_type = 'internal';

  -- Nếu là Đối tác, chỉ trả về dữ liệu của chính họ
  ELSIF 'Đối tác' = ANY(user_roles) THEN
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE f.user_id = auth.uid() AND dsc.audience_type = 'internal';

  -- Các vai trò khác (ví dụ: Cộng tác viên)
  ELSE
    -- Lấy ID của tất cả người dùng có vai trò 'Đối tác'
    SELECT array_agg(ur.user_id) INTO partner_user_ids
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE r.name = 'Đối tác';

    -- Trả về tất cả dữ liệu, NGOẠI TRỪ dữ liệu của các 'Đối tác'
    RETURN QUERY
    SELECT
      f.id, f.campaign_id, f.posted_at, f.keywords_found, f.ai_evaluation, f.sentiment, f.source_url, f.scanned_at, f.content AS description, f.suggested_comment, f.identified_service_id, f.source_post_id
    FROM public."Bao_cao_Facebook" f
    JOIN public.danh_sach_chien_dich dsc ON f.campaign_id = dsc.id
    WHERE (f.user_id IS NULL OR NOT (f.user_id = ANY(COALESCE(partner_user_ids, ARRAY[]::UUID[]))))
    AND dsc.audience_type = 'internal';
  END IF;
END;
$function$;