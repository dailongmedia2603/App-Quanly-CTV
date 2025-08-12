ALTER TABLE public.contracts
ADD COLUMN contract_link TEXT;

ALTER TABLE public.contracts
DROP COLUMN payment_status;