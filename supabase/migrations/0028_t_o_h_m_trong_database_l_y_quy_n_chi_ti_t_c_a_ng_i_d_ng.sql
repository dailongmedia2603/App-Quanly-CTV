CREATE OR REPLACE FUNCTION public.get_user_roles_with_permissions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_roles JSONB;
BEGIN
  SELECT jsonb_agg(r.*)
  INTO user_roles
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
  
  RETURN COALESCE(user_roles, '[]'::jsonb);
END;
$$;