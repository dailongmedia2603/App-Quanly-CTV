-- Thêm các cột API key vào bảng cài đặt chung của ứng dụng
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_model TEXT,
ADD COLUMN IF NOT EXISTS facebook_api_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_api_token TEXT,
ADD COLUMN IF NOT EXISTS firecrawl_api_key TEXT;

-- Xóa bảng API key cũ của từng người dùng
DROP TABLE IF EXISTS public.user_api_keys;