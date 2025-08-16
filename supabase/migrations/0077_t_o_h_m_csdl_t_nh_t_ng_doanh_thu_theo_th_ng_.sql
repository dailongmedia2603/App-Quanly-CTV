CREATE OR REPLACE FUNCTION public.get_monthly_revenue(target_month date)
RETURNS numeric
LANGUAGE sql
AS $$
  SELECT COALESCE(SUM(c.contract_value), 0)
  FROM contracts c
  WHERE
    date_trunc('month', c.start_date AT TIME ZONE 'UTC') = date_trunc('month', target_month AT TIME ZONE 'UTC')
    AND EXISTS (
      SELECT 1
      FROM contract_payments cp
      WHERE cp.contract_id = c.id AND cp.amount > 0
    );
$$;