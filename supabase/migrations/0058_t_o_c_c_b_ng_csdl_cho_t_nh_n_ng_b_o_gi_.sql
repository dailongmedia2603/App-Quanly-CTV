-- Create service_prices table to store service pricing information
CREATE TABLE public.service_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for service_prices
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

-- Policies for service_prices: Authenticated can read, Super Admins can manage
CREATE POLICY "Allow authenticated read access to service prices" ON public.service_prices
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Super Admins to manage service prices" ON public.service_prices
FOR ALL TO authenticated USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));

-- Create quote_templates table to store quote templates
CREATE TABLE public.quote_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for quote_templates
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Policies for quote_templates: Authenticated can read, Super Admins can manage
CREATE POLICY "Allow authenticated read access to quote templates" ON public.quote_templates
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Super Admins to manage quote templates" ON public.quote_templates
FOR ALL TO authenticated USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));

-- Create generated_quotes table to store AI-generated quotes
CREATE TABLE public.generated_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget NUMERIC NOT NULL,
  generated_content TEXT,
  final_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for generated_quotes
ALTER TABLE public.generated_quotes ENABLE ROW LEVEL SECURITY;

-- Policies for generated_quotes: Users can manage their own, Super Admins can manage all
CREATE POLICY "Users can manage their own quotes" ON public.generated_quotes
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super Admins can manage all quotes" ON public.generated_quotes
FOR ALL TO authenticated USING (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))))
WITH CHECK (('Super Admin'::text IN ( SELECT get_user_roles.role_name FROM get_user_roles() get_user_roles(role_name))));