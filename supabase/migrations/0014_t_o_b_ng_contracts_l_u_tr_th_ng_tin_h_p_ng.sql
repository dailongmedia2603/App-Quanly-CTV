-- Create contracts table
CREATE TABLE public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  contract_value NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON COLUMN public.contracts.status IS 'Can be: ongoing, completed';
COMMENT ON COLUMN public.contracts.payment_status IS 'Can be: unpaid, partially_paid, paid';

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);