-- Add columns to generated_quotes to store more details
ALTER TABLE public.generated_quotes
ADD COLUMN name TEXT,
ADD COLUMN service_ids UUID[],
ADD COLUMN includes_vat BOOLEAN DEFAULT true,
ADD COLUMN other_requirements TEXT;

-- Add service_id to quote_templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='quote_templates' AND column_name='service_id') THEN
    ALTER TABLE public.quote_templates ADD COLUMN service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL;
  END IF;
END $$;