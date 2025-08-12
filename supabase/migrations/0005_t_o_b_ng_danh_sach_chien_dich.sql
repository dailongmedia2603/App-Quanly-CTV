CREATE TABLE public.danh_sach_chien_dich (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sources TEXT[] NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  scan_frequency INTEGER NOT NULL,
  scan_unit TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  scan_start_date TIMESTAMP WITH TIME ZONE,
  keywords TEXT,
  ai_filter_enabled BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  next_scan_at TIMESTAMP WITH TIME ZONE,
  website_scan_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.danh_sach_chien_dich ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Người dùng chỉ quản lý chiến dịch của mình
CREATE POLICY "Users can manage their own campaigns" ON public.danh_sach_chien_dich
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);