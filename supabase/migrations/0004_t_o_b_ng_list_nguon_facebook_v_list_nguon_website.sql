-- Bảng nguồn Facebook
CREATE TABLE public.list_nguon_facebook (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_name TEXT,
  group_id TEXT,
  origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng nguồn Website
CREATE TABLE public.list_nguon_website (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  endpoint TEXT,
  pages INTEGER,
  origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.list_nguon_facebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_nguon_website ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Người dùng đã xác thực có thể quản lý các nguồn
CREATE POLICY "Allow all access for authenticated users on facebook sources" ON public.list_nguon_facebook FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for authenticated users on website sources" ON public.list_nguon_website FOR ALL TO authenticated USING (true) WITH CHECK (true);