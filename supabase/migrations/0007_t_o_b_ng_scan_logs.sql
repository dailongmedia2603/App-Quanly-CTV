CREATE TABLE public.scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.danh_sach_chien_dich(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT,
  message TEXT,
  details JSONB,
  log_type TEXT,
  source_type TEXT
);

-- Bật RLS
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Người dùng chỉ xem log của mình
CREATE POLICY "Users can view their own scan logs" ON public.scan_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);