CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TABLE(role_name TEXT)
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
$$;