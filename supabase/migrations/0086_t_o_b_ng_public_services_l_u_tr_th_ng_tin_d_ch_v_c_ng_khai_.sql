-- Create the new table for public-facing services
CREATE TABLE public.public_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_list_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (REQUIRED)
ALTER TABLE public.public_services ENABLE ROW LEVEL SECURITY;

-- Policy: Allow any authenticated user to VIEW the services
CREATE POLICY "Allow authenticated users to read public services"
ON public.public_services FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow ONLY Super Admins to manage services
CREATE POLICY "Allow Super Admins to manage public services"
ON public.public_services FOR ALL
TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));