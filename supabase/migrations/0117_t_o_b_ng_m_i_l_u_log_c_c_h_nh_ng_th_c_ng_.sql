-- Create manual_action_logs table
CREATE TABLE public.manual_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  request_url TEXT,
  request_body JSONB,
  response_status INT,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manual_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own logs"
ON public.manual_action_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own logs"
ON public.manual_action_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super Admins can manage all logs"
ON public.manual_action_logs
FOR ALL TO authenticated
USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name
   FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name
   FROM get_user_roles() get_user_roles(role_name))));