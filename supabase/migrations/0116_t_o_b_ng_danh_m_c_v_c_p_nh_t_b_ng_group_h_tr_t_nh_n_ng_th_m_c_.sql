-- Create the categories table
CREATE TABLE public.facebook_group_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.facebook_group_categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Allow authenticated read on fb group categories" ON public.facebook_group_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Super Admins to manage fb group categories" ON public.facebook_group_categories
  FOR ALL TO authenticated USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));

-- Add category_id to the facebook sources table
ALTER TABLE public.list_nguon_facebook
ADD COLUMN category_id UUID REFERENCES public.facebook_group_categories(id) ON DELETE SET NULL;