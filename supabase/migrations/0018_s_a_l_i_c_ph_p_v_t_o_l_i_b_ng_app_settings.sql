-- Create app_settings table to store global application settings
CREATE TABLE public.app_settings (
  id BIGINT PRIMARY KEY,
  support_widget_icon TEXT,
  support_widget_title TEXT,
  support_widget_description TEXT,
  support_widget_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for the app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all authenticated users to read the settings.
CREATE POLICY "Allow authenticated users to read settings" ON public.app_settings
FOR SELECT TO authenticated USING (true);

-- Create a policy that allows users with the 'Super Admin' role to manage all settings.
CREATE POLICY "Allow Super Admins to manage settings" ON public.app_settings
FOR ALL TO authenticated
USING (
  'Super Admin' IN (SELECT role_name FROM public.get_user_roles())
)
WITH CHECK (
  'Super Admin' IN (SELECT role_name FROM public.get_user_roles())
);

-- Insert a default row of settings to ensure the application has initial values.
INSERT INTO public.app_settings (id, support_widget_title, support_widget_description, support_widget_icon, support_widget_link)
VALUES (1, 'Hỗ trợ', 'Liên hệ để được giúp đỡ', 'LifeBuoy', '#')
ON CONFLICT (id) DO NOTHING;