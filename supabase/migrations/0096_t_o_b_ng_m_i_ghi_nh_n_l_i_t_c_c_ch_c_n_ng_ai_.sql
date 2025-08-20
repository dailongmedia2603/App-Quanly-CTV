-- Create table to log AI-related errors
CREATE TABLE public.ai_error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT,
  function_name TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Only Super Admins can view logs.
CREATE POLICY "Super Admins can view all AI error logs"
ON public.ai_error_logs
FOR SELECT
TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));