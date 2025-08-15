-- Step 1: Create the new contract_payments table
CREATE TABLE public.contract_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security on the new table
ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security policies for the new table
CREATE POLICY "Users can manage payments for their own contracts"
ON public.contract_payments
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Super Admins can manage all payments"
ON public.contract_payments
FOR ALL
USING (
  'Super Admin' IN (
    SELECT role_name FROM get_user_roles()
  )
);

-- Step 4: Migrate existing paid_amount data to the new table
-- This assumes the paid_amount was for a single payment on the contract's start_date
INSERT INTO public.contract_payments (contract_id, user_id, amount, payment_date, notes)
SELECT id, user_id, paid_amount, start_date, 'Dữ liệu được di chuyển từ hệ thống cũ'
FROM public.contracts
WHERE paid_amount > 0;

-- Step 5: Drop the old paid_amount column from the contracts table
ALTER TABLE public.contracts
DROP COLUMN IF EXISTS paid_amount;