ALTER TABLE public.email_campaign_logs
ADD COLUMN email_content_id UUID REFERENCES public.email_contents(id) ON DELETE SET NULL;