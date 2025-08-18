-- Create the table to store video guides
CREATE TABLE public.video_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  "position" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.video_guides ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Super Admins to manage all video guides
CREATE POLICY "Allow Super Admins to manage video guides"
ON public.video_guides
FOR ALL
USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));

-- Policy: Allow all authenticated users to read video guides
CREATE POLICY "Allow authenticated users to read video guides"
ON public.video_guides
FOR SELECT
TO authenticated
USING (true);