-- Bảng cài đặt chung
CREATE TABLE public.app_settings (
  id INTEGER PRIMARY KEY,
  support_widget_icon TEXT,
  support_widget_title TEXT,
  support_widget_description TEXT,
  support_widget_link TEXT,
  bank_transfer_info TEXT,
  qr_code_url TEXT
);

-- Bảng các gói giá
CREATE TABLE public.pricing_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT,
  period TEXT,
  description TEXT,
  features TEXT[],
  button_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER
);

-- Bật RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Mọi người có thể đọc, chỉ Super Admin có thể sửa
CREATE POLICY "Allow public read access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.pricing_plans FOR SELECT USING (true);

CREATE POLICY "Allow Super Admins to manage" ON public.app_settings FOR ALL
  USING ((SELECT 'Super Admin' IN (SELECT public.get_user_roles())) = true)
  WITH CHECK ((SELECT 'Super Admin' IN (SELECT public.get_user_roles())) = true);

CREATE POLICY "Allow Super Admins to manage" ON public.pricing_plans FOR ALL
  USING ((SELECT 'Super Admin' IN (SELECT public.get_user_roles())) = true)
  WITH CHECK ((SELECT 'Super Admin' IN (SELECT public.get_user_roles())) = true);