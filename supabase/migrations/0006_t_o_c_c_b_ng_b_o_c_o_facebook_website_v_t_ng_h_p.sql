-- Báo cáo Facebook
CREATE TABLE public."Bao_cao_Facebook" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.danh_sach_chien_dich(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  keywords_found TEXT[],
  ai_evaluation TEXT,
  sentiment TEXT,
  source_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Báo cáo Website
CREATE TABLE public."Bao_cao_Website" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.danh_sach_chien_dich(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  price TEXT,
  area TEXT,
  address TEXT,
  listing_url TEXT,
  posted_date_string TEXT,
  source_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Báo cáo Tổng hợp
CREATE TABLE public."Bao_cao_tong_hop" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.danh_sach_chien_dich(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT, -- 'Facebook' or 'Website'
  description TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  keywords_found TEXT[],
  ai_evaluation TEXT,
  sentiment TEXT,
  title TEXT,
  price TEXT,
  area TEXT,
  address TEXT,
  listing_url TEXT,
  posted_date_string TEXT,
  source_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public."Bao_cao_Facebook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Bao_cao_Website" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Bao_cao_tong_hop" ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Người dùng chỉ xem báo cáo của mình
CREATE POLICY "Users can view their own facebook reports" ON public."Bao_cao_Facebook" FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own website reports" ON public."Bao_cao_Website" FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own combined reports" ON public."Bao_cao_tong_hop" FOR SELECT TO authenticated USING (auth.uid() = user_id);