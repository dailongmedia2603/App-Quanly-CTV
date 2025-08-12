-- Bảng chứa các vai trò (ví dụ: Super Admin, Admin, User)
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng trung gian để gán vai trò cho người dùng
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Bật RLS cho các bảng
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật:
-- Mọi người dùng đã xác thực đều có thể đọc danh sách các vai trò.
CREATE POLICY "Allow authenticated read access to roles" ON public.roles FOR SELECT TO authenticated USING (true);
-- Mọi người dùng đã xác thực đều có thể đọc các vai trò được gán.
CREATE POLICY "Allow authenticated read access to user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);