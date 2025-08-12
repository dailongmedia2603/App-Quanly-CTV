-- Create table for AI generation logs
CREATE TABLE public.ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_type TEXT NOT NULL,
  final_prompt TEXT,
  generated_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON TABLE public.ai_generation_logs IS 'Stores a history of prompts sent to AI and the content generated.';
COMMENT ON COLUMN public.ai_generation_logs.user_id IS 'The user who triggered the generation.';
COMMENT ON COLUMN public.ai_generation_logs.template_type IS 'The type of content generated (e.g., post, comment).';
COMMENT ON COLUMN public.ai_generation_logs.final_prompt IS 'The exact prompt sent to the AI after variable replacement.';
COMMENT ON COLUMN public.ai_generation_logs.generated_content IS 'The content returned by the AI.';

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own logs
CREATE POLICY "Users can insert their own generation logs"
ON public.ai_generation_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for Super Admins to manage all logs
CREATE POLICY "Super Admins can manage all generation logs"
ON public.ai_generation_logs
FOR ALL
TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));