ALTER TABLE public."Bao_cao_tong_hop"
ADD COLUMN identified_service_id UUID REFERENCES public.document_services(id) ON DELETE SET NULL;

COMMENT ON COLUMN public."Bao_cao_tong_hop".identified_service_id IS 'Dịch vụ được AI tự động xác định là có liên quan đến bài đăng này.';