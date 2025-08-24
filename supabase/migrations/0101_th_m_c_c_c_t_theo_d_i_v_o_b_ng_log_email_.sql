-- Thêm các cột để lưu thời gian mở và click email
ALTER TABLE public.email_campaign_logs
ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE;