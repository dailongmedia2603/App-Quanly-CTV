-- Create the table for customer finder groups
CREATE TABLE public.customer_finder_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.customer_finder_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Allow any authenticated user to read the groups
CREATE POLICY "Allow authenticated users to read finder groups"
ON public.customer_finder_groups FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow only Super Admins to manage the groups
CREATE POLICY "Allow Super Admins to manage finder groups"
ON public.customer_finder_groups FOR ALL
TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));