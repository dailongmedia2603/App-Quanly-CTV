-- Drop the old table to implement the new category structure
DROP TABLE IF EXISTS public.customer_finder_groups;

-- Create a table for the group categories
CREATE TABLE public.customer_finder_group_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the table for the groups, linked to categories
CREATE TABLE public.customer_finder_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.customer_finder_group_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.customer_finder_group_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_finder_groups ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
CREATE POLICY "Allow authenticated read on finder group categories" ON public.customer_finder_group_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow Super Admins to manage finder group categories" ON public.customer_finder_group_categories FOR ALL TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));

-- Policies for Groups
CREATE POLICY "Allow authenticated read on finder groups" ON public.customer_finder_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow Super Admins to manage finder groups" ON public.customer_finder_groups FOR ALL TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));