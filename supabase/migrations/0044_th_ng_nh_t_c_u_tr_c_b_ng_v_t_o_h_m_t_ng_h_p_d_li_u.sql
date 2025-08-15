-- Thêm cột còn thiếu vào bảng Bao_cao_Facebook để đồng bộ cấu trúc
ALTER TABLE public."Bao_cao_Facebook"
ADD COLUMN IF NOT EXISTS identified_service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL;

-- Tạo hàm trong database để tổng hợp tất cả bài viết Facebook từ hai bảng
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
    content AS description, -- Đổi tên cột 'content' thành 'description' cho nhất quán
    suggested_comment,
    identified_service_id
  FROM public."Bao_cao_Facebook"
  UNION ALL
  SELECT
    id,
    campaign_id,
    posted_at,
    keywords_found,
    ai_evaluation,
    sentiment,
    source_url,
    scanned_at,
    description,
    suggested_comment,
    identified_service_id
  FROM public."Bao_cao_tong_hop"
  WHERE source_type = 'Facebook';
$$;