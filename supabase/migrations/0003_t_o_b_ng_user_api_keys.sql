CREATE TABLE public.user_api_keys (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  gemini_api_key TEXT,
  gemini_model TEXT,
  facebook_api_url TEXT,
  facebook_api_token TEXT,
  firecrawl_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Bật RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật: Người dùng chỉ có thể quản lý API key của chính mình
CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);