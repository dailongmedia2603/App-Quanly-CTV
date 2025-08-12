-- Gán quyền Super Admin cho người dùng được chỉ định
DO $$
DECLARE
  target_user_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Lấy ID của người dùng từ email
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'huulong111@gmail.com';

  -- Lấy ID của vai trò 'Super Admin'
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'Super Admin';

  -- Nếu cả người dùng và vai trò đều tồn tại, thực hiện gán quyền
  IF target_user_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
    -- Thêm quyền Super Admin cho người dùng, bỏ qua nếu đã tồn tại
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (target_user_id, super_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSE
    RAISE NOTICE 'Không tìm thấy người dùng huulong111@gmail.com hoặc vai trò Super Admin.';
  END IF;
END $$;