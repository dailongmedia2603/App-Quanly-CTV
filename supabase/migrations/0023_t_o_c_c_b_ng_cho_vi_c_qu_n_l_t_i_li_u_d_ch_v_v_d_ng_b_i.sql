-- Create table for services
CREATE TABLE public.document_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.document_services IS 'Stores different types of services for document categorization.';

-- Create table for post types
CREATE TABLE public.document_post_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.document_post_types IS 'Stores different types of posts for document categorization.';

-- Create table for documents
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL,
  post_type_id UUID REFERENCES public.document_post_types(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.documents IS 'Stores the main content of the documents.';

-- RLS Policies for all tables (Super Admin access only)
ALTER TABLE public.document_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_post_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can manage services" ON public.document_services FOR ALL TO authenticated USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))) WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));
CREATE POLICY "Super Admins can manage post types" ON public.document_post_types FOR ALL TO authenticated USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))) WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));
CREATE POLICY "Super Admins can manage documents" ON public.documents FOR ALL TO authenticated USING ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))) WITH CHECK ('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name)));