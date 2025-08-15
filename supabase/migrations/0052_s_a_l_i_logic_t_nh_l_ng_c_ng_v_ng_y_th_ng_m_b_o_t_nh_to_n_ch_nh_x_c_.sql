CREATE OR REPLACE FUNCTION get_income_stats_for_month(
    target_month DATE,
    target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    fixed_salary NUMERIC,
    new_contract_commission NUMERIC,
    old_contract_commission NUMERIC,
    total_income NUMERIC,
    contract_count BIGINT,
    actual_received NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Current month variables
    start_of_current_month TIMESTAMPTZ := date_trunc('month', target_month);
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
BEGIN
    -- Explicitly define month boundaries to avoid timezone/edge case issues
    end_of_current_month := start_of_current_month + INTERVAL '1 month' - INTERVAL '1 second';
    start_of_previous_month := start_of_current_month - INTERVAL '1 month';
    end_of_previous_month := start_of_current_month - INTERVAL '1 second';

    -- Calculate total new contract value for the CURRENT month
    SELECT COALESCE(SUM(c.contract_value), 0)
    INTO total_new_contract_value_current
    FROM contracts c
    WHERE c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Calculate total new contract value for the PREVIOUS month
    SELECT COALESCE(SUM(c.contract_value), 0)
    INTO total_new_contract_value_previous
    FROM contracts c
    WHERE c.start_date >= start_of_previous_month AND c.start_date <= end_of_previous_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Determine fixed salary based on CURRENT month's sales (FIXED: using >=)
    IF total_new_contract_value_current >= 40000000 THEN
        fixed_salary_current := 3000000;
    ELSIF total_new_contract_value_current >= 20000000 THEN
        fixed_salary_current := 2000000;
    ELSIF total_new_contract_value_current >= 10000000 THEN
        fixed_salary_current := 1000000;
    ELSE
        fixed_salary_current := 0;
    END IF;

    -- Determine fixed salary based on PREVIOUS month's sales (FIXED: using >=)
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
    fixed_salary := GREATEST(fixed_salary_current, fixed_salary_previous);

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
    INTO new_contract_commission
    FROM contract_payments p
    JOIN contracts c ON p.contract_id = c.id
    WHERE p.payment_date >= start_of_current_month AND p.payment_date <= end_of_current_month
    AND c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Calculate commission from OLD contracts (started before this month)
    WITH historical_rates AS (
        SELECT
            date_trunc('month', c.start_date)::date AS contract_month,
            c.user_id,
            CASE
                WHEN SUM(c.contract_value) OVER (PARTITION BY date_trunc('month', c.start_date), c.user_id) >= 40000000 THEN 0.10
                WHEN SUM(c.contract_value) OVER (PARTITION BY date_trunc('month', c.start_date), c.user_id) >= 20000000 THEN 0.07
                ELSE 0.05
            END AS rate
        FROM contracts c
        WHERE (target_user_id IS NULL OR c.user_id = target_user_id)
    )
    SELECT COALESCE(SUM(p.amount * hr.rate), 0)
    INTO old_contract_commission
    FROM contract_payments p
    JOIN contracts c ON p.contract_id = c.id
    JOIN historical_rates hr ON hr.contract_month = date_trunc('month', c.start_date)::date AND hr.user_id = c.user_id
    WHERE p.payment_date >= start_of_current_month AND p.payment_date <= end_of_current_month
    AND c.start_date < start_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    -- Final calculations
    total_income := fixed_salary + new_contract_commission + old_contract_commission;
    actual_received := new_contract_commission + old_contract_commission;

    SELECT COUNT(*)
    INTO contract_count
    FROM contracts c
    WHERE c.start_date >= start_of_current_month AND c.start_date <= end_of_current_month
    AND (target_user_id IS NULL OR c.user_id = target_user_id);

    RETURN QUERY SELECT
        fixed_salary,
        new_contract_commission,
        old_contract_commission,
        total_income,
        contract_count,
        actual_received;
END;
$$;