CREATE OR REPLACE FUNCTION public.get_all_income_stats_for_month(target_month date)
 RETURNS TABLE(user_id uuid, full_name text, email text, fixed_salary numeric, new_contract_commission numeric, old_contract_commission numeric, total_income numeric, contract_count bigint, actual_received numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT
        u.id,
        COALESCE(p.first_name || ' ' || p.last_name, u.email),
        u.email,
        stats.fixed_salary,
        stats.new_contract_commission,
        stats.old_contract_commission,
        stats.total_income,
        stats.contract_count,
        stats.actual_received
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    CROSS JOIN LATERAL
        public.get_income_stats_for_month(target_month, u.id) stats
    WHERE
        stats.total_income > 0 OR stats.contract_count > 0;
$function$