-- Create a table to store chat sessions
CREATE TABLE public.consulting_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sessions
ALTER TABLE public.consulting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can manage their own sessions" ON public.consulting_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create a table to store chat messages
CREATE TABLE public.consulting_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.consulting_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' (customer) or 'assistant' (AI)
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.consulting_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can manage messages in their own sessions" ON public.consulting_messages
  FOR ALL USING ((
    SELECT user_id FROM public.consulting_sessions WHERE id = session_id
  ) = auth.uid());