-- Thêm cột mới để lưu tiêu đề trang
ALTER TABLE public.app_settings
ADD COLUMN page_title TEXT;

-- Đặt giá trị mặc định cho tiêu đề trang hiện tại
UPDATE public.app_settings
SET page_title = 'Listen PRO - Lắng nghe điều bạn muốn'
WHERE id = 1;