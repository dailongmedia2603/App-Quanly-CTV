CREATE OR REPLACE FUNCTION get_old_contracts_with_payments_in_month(
    target_month DATE,
    target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    contract_id UUID,
    project_name TEXT,
    start_date TIMESTAMPTZ,
    amount_paid_in_month NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.id as contract_id,
    c.project_name,
    c.start_date,
    SUM(p.amount) as amount_paid_in_month
  FROM contract_payments p
  JOIN contracts c ON p.contract_id = c.id
  WHERE
    p.payment_date >= date_trunc('month', target_month) AND
    p.payment_date < date_trunc('month', target_month) + INTERVAL '1 month' AND
    c.start_date < date_trunc('month', target_month) AND
    (target_user_id IS NULL OR c.user_id = target_user_id)
  GROUP BY c.id, c.project_name, c.start_date;
$$;