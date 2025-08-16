CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_role_id UUID;
BEGIN
  -- 1. Tạo một profile cho người dùng mới
  INSERT INTO public.profiles (id)
  VALUES (new.id);

  -- 2. Lấy ID của vai trò 'Cộng tác viên'
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'Cộng tác viên';

  -- 3. Nếu vai trò 'Cộng tác viên' tồn tại, gán nó cho người dùng mới
  IF user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, user_role_id);
  END IF;

  RETURN new;
END;
$function$