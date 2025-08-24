-- 1. Create a new table for email content groups
CREATE TABLE public.email_content_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security for the new table
ALTER TABLE public.email_content_groups ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the new table
CREATE POLICY "Users can manage their own content groups" ON public.email_content_groups
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Add a group_id column to the email_contents table
ALTER TABLE public.email_contents
ADD COLUMN group_id UUID REFERENCES public.email_content_groups(id) ON DELETE SET NULL;