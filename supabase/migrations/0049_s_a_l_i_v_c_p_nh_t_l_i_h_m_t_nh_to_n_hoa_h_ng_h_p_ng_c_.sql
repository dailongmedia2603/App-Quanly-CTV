-- First, drop the existing function to allow for changing the return type
DROP FUNCTION IF EXISTS get_old_contracts_with_payments_in_month(DATE, UUID);

-- Now, create the new version of the function with the correct return columns
CREATE OR REPLACE FUNCTION get_old_contracts_with_payments_in_month(
    target_month DATE,
    target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    contract_id UUID,
    project_name TEXT,
    start_date TIMESTAMPTZ,
    amount_paid_in_month NUMERIC,
    commission_rate NUMERIC,
    commission_amount NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH historical_rates AS (
    SELECT DISTINCT ON (date_trunc('month', c.start_date), c.user_id)
        date_trunc('month', c.start_date)::date AS contract_month,
        c.user_id,
        CASE
            WHEN SUM(c.contract_value) OVER (PARTITION BY date_trunc('month', c.start_date), c.user_id) >= 40000000 THEN 0.10
            WHEN SUM(c.contract_value) OVER (PARTITION BY date_trunc('month', c.start_date), c.user_id) >= 20000000 THEN 0.07
            ELSE 0.05
        END AS rate
    FROM contracts c
  ),
  payments_in_month AS (
    SELECT
      c.id as contract_id,
      c.project_name,
      c.start_date,
      c.user_id,
      SUM(p.amount) as amount_paid_in_month
    FROM contract_payments p
    JOIN contracts c ON p.contract_id = c.id
    WHERE
      p.payment_date >= date_trunc('month', target_month) AND
      p.payment_date < date_trunc('month', target_month) + INTERVAL '1 month' AND
      c.start_date < date_trunc('month', target_month) AND
      (target_user_id IS NULL OR c.user_id = target_user_id)
    GROUP BY c.id, c.project_name, c.start_date, c.user_id
  )
  SELECT
    pim.contract_id,
    pim.project_name,
    pim.start_date,
    pim.amount_paid_in_month,
    hr.rate as commission_rate,
    (pim.amount_paid_in_month * hr.rate) as commission_amount
  FROM payments_in_month pim
  JOIN historical_rates hr ON hr.contract_month = date_trunc('month', pim.start_date)::date AND hr.user_id = pim.user_id;
$$;