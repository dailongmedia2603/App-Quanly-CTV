-- Add service_id column to quote_templates to link with a service
ALTER TABLE public.quote_templates
ADD COLUMN service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX idx_quote_templates_service_id ON public.quote_templates(service_id);