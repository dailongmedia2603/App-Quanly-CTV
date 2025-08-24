-- Thêm cột mới để lưu danh sách ID nội dung
ALTER TABLE public.email_campaigns ADD COLUMN email_content_ids UUID[];

-- Chuyển dữ liệu từ cột cũ sang cột mới
UPDATE public.email_campaigns
SET email_content_ids = ARRAY[email_content_id]
WHERE email_content_id IS NOT NULL;

-- Xóa cột cũ không còn sử dụng
ALTER TABLE public.email_campaigns DROP COLUMN email_content_id;