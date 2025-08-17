-- Drop the old, simple table first
DROP TABLE IF EXISTS public.public_services;

-- Create a table for the main categories (left panel)
CREATE TABLE public.service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT, -- To store lucide-react icon names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for the service details (right panel content)
CREATE TABLE public.service_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_info_content TEXT,
  pricing_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_details ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
CREATE POLICY "Allow authenticated read on categories" ON public.service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow Super Admins to manage categories" ON public.service_categories FOR ALL TO authenticated 
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));

-- Policies for Details
CREATE POLICY "Allow authenticated read on service details" ON public.service_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow Super Admins to manage service details" ON public.service_details FOR ALL TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));