-- Create table for AI prompt templates
CREATE TABLE public.ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL UNIQUE,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policies for Super Admins
CREATE POLICY "Allow Super Admins to manage prompt templates"
ON public.ai_prompt_templates
FOR ALL
TO authenticated
USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)))
WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));

-- Seed initial data for the three template types
INSERT INTO public.ai_prompt_templates (template_type, prompt)
VALUES
  ('post', 'Bạn là một chuyên gia viết nội dung chuyên nghiệp. Hãy viết một bài đăng trên Facebook về [chủ đề] với giọng văn [giọng văn]. Bài đăng nên dài khoảng [độ dài] từ và bao gồm các hashtag liên quan.'),
  ('comment', 'Bạn là một quản lý cộng đồng hữu ích. Hãy viết một bình luận thân thiện và hấp dẫn để trả lời một bài đăng về [chủ đề]. Bình luận của bạn nên khuyến khích thảo luận.'),
  ('consulting', 'Bạn là một chuyên gia tư vấn. Một khách hàng có vấn đề sau: "[vấn đề của khách hàng]". Hãy cung cấp một phản hồi hữu ích và chuyên nghiệp để giải quyết vấn đề của họ và đề xuất một giải pháp.');