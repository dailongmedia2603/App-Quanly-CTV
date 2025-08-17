-- Function to automatically set user_id on a new payment
CREATE OR REPLACE FUNCTION public.set_payment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the user_id from the associated contract and assign it to the new payment record
  SELECT user_id INTO NEW.user_id
  FROM public.contracts
  WHERE id = NEW.contract_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs the function before any new payment is inserted
CREATE TRIGGER on_payment_insert_set_user_id
BEFORE INSERT ON public.contract_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_payment_user_id();