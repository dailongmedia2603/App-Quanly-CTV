-- Thêm các vai trò mặc định vào hệ thống
-- ON CONFLICT DO NOTHING sẽ bỏ qua nếu vai trò đã tồn tại, tránh gây lỗi
INSERT INTO public.roles (name)
VALUES
  ('Super Admin'),
  ('Admin'),
  ('User')
ON CONFLICT (name) DO NOTHING;