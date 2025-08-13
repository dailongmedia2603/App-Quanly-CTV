CREATE POLICY "Super Admins can manage all contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));