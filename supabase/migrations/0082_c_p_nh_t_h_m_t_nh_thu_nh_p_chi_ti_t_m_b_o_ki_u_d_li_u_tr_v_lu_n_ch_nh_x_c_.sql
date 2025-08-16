CREATE OR REPLACE FUNCTION public.get_income_stats_for_month(target_month date, target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(fixed_salary numeric, new_contract_commission numeric, old_contract_commission numeric, total_income numeric, contract_count bigint, actual_received numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Timezone for calculations
    vietnam_tz TEXT := 'Asia/Ho_Chi_Minh';

    -- Current month variables
    start_of_current_month TIMESTAMPTZ := date_trunc('month', target_month::timestamp, vietnam_tz);
    end_of_current_month TIMESTAMPTZ;
    total_new_contract_value_current NUMERIC;
    fixed_salary_current NUMERIC;

    -- Previous month variables
    start_of_previous_month TIMESTAMPTZ;
    end_of_previous_month TIMESTAMPTZ;
    total_new_contract_value_previous NUMERIC;
    fixed_salary_previous NUMERIC;

    -- Commission rate for current month
    monthly_commission_rate NUMERIC;

    -- Local variables for calculation results
    fixed_salary_val NUMERIC;
    new_contract_commission_val NUMERIC;
    old_contract_commission_val NUMERIC;
    total_income_val NUMERIC;
    contract_count_val BIGINT;
    actual_received_val NUMERIC;
BEGIN
    -- Explicitly define month boundaries in the correct timezone
    end_of_current_month := start_of_current_month + INTERVAL '1 month' - INTERVAL '1 second';
    start_of_previous_month := start_of_current_month - INTERVAL '1 month';
    end_of_previous_month := start_of_current_month - INTERVAL '1 second';

    -- Calculate total new contract value for the CURRENT month (only if it has payments)
    SELECT COALESCE(SUM(c.contract_value), 0)
    INTO total_new_contract_value_current
    FROM contracts c
    WHERE c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id)
    AND EXISTS (SELECT 1 FROM contract_payments cp WHERE cp.contract_id = c.id);

    -- Calculate total new contract value for the PREVIOUS month (only if it has payments)
    SELECT COALESCE(SUM(c.contract_value), 0)
    INTO total_new_contract_value_previous
    FROM contracts c
    WHERE c.start_date >= start_of_previous_month AND c.start_date <= end_of_previous_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id)
    AND EXISTS (SELECT 1 FROM contract_payments cp WHERE cp.contract_id = c.id);

    -- Determine fixed salary based on CURRENT month's sales
    IF total_new_contract_value_current >= 40000000 THEN
        fixed_salary_current := 3000000;
    ELSIF total_new_contract_value_current >= 20000000 THEN
        fixed_salary_current := 2000000;
    ELSIF total_new_contract_value_current >= 10000000 THEN
        fixed_salary_current := 1000000;
    ELSE
        fixed_salary_current := 0;
    END IF;

    -- Determine fixed salary based on PREVIOUS month's sales
    IF total_new_contract_value_previous >= 40000000 THEN
        fixed_salary_previous := 3000000;
    ELSIF total_new_contract_value_previous >= 20000000 THEN
        fixed_salary_previous := 2000000;
    ELSIF total_new_contract_value_previous >= 10000000 THEN
        fixed_salary_previous := 1000000;
    ELSE
        fixed_salary_previous := 0;
    END IF;

    -- Final fixed salary is the greater of the two
    fixed_salary_val := GREATEST(fixed_salary_current, fixed_salary_previous);

    -- Determine commission rate for the month (based on CURRENT month's sales)
    IF total_new_contract_value_current >= 40000000 THEN
        monthly_commission_rate := 0.10;
    ELSIF total_new_contract_value_current >= 20000000 THEN
        monthly_commission_rate := 0.07;
    ELSE
        monthly_commission_rate := 0.05;
    END IF;

    -- Calculate commission from NEW contracts (started this month)
    SELECT COALESCE(SUM(p.amount), 0) * monthly_commission_rate
    INTO new_contract_commission_val
    FROM contract_payments p
    JOIN contracts c ON p.contract_id = c.id
    WHERE p.payment_date >= start_of_current_month AND p.payment_date <= end_of_current_month
    AND c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Calculate commission from OLD contracts (started before this month)
    WITH monthly_sales AS (
        SELECT
            date_trunc('month', start_date)::date as sales_month,
            user_id,
            SUM(contract_value) as total_sales
        FROM contracts
        WHERE (target_user_id IS NULL OR contracts.user_id = target_user_id)
        GROUP BY 1, 2
    ),
    historical_rates AS (
        SELECT
            sales_month,
            user_id,
            CASE
                WHEN total_sales >= 40000000 THEN 0.10
                WHEN total_sales >= 20000000 THEN 0.07
                ELSE 0.05
            END AS rate
        FROM monthly_sales
    )
    SELECT COALESCE(SUM(p.amount * hr.rate), 0)
    INTO old_contract_commission_val
    FROM contract_payments p
    JOIN contracts c ON p.contract_id = c.id
    JOIN historical_rates hr ON hr.sales_month = date_trunc('month', c.start_date)::date AND hr.user_id = c.user_id
    WHERE p.payment_date >= start_of_current_month AND p.payment_date <= end_of_current_month
    AND c.start_date < start_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Final calculations
    total_income_val := fixed_salary_val + COALESCE(new_contract_commission_val, 0) + COALESCE(old_contract_commission_val, 0);
    actual_received_val := COALESCE(new_contract_commission_val, 0) + COALESCE(old_contract_commission_val, 0);

    SELECT COUNT(*)
    INTO contract_count_val
    FROM contracts c
    WHERE c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    RETURN QUERY SELECT
        fixed_salary_val::numeric,
        COALESCE(new_contract_commission_val, 0)::numeric,
        COALESCE(old_contract_commission_val, 0)::numeric,
        total_income_val::numeric,
        contract_count_val::bigint,
        actual_received_val::numeric;
END;
$function$