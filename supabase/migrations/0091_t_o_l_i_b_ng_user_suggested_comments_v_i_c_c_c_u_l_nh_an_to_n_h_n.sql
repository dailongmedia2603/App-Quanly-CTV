-- Create a table to store user-specific suggested comments, if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_suggested_comments (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public."Bao_cao_Facebook"(id) ON DELETE CASCADE,
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, report_id)
);

-- Enable Row Level Security for the new table
ALTER TABLE public.user_suggested_comments ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists, to make this script re-runnable
DROP POLICY IF EXISTS "Users can manage their own suggested comments" ON public.user_suggested_comments;

-- Create policies to ensure users can only access their own comments
CREATE POLICY "Users can manage their own suggested comments"
ON public.user_suggested_comments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);