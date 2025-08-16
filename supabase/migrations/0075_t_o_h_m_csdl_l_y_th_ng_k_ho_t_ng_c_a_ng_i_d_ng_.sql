CREATE OR REPLACE FUNCTION public.get_user_activity_stats()
RETURNS TABLE(
    user_id uuid,
    full_name text,
    email text,
    post_count bigint,
    comment_count bigint,
    consulting_session_count bigint,
    total_messages_count bigint,
    active_days_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id as user_id,
    COALESCE(p.first_name || ' ' || p.last_name, u.email) as full_name,
    u.email,
    (
      SELECT COUNT(*)
      FROM public.ai_generation_logs AS agl
      WHERE agl.user_id = u.id AND agl.template_type = 'post'
    ) AS post_count,
    (
      SELECT COUNT(*)
      FROM public.ai_generation_logs AS agl
      WHERE agl.user_id = u.id AND agl.template_type IN ('comment', 'customer_finder_comment')
    ) AS comment_count,
    (
      SELECT COUNT(*)
      FROM public.consulting_sessions AS cs
      WHERE cs.user_id = u.id
    ) AS consulting_session_count,
    (
      SELECT COUNT(*)
      FROM public.consulting_messages AS cm
      WHERE cm.session_id IN (SELECT id FROM public.consulting_sessions WHERE user_id = u.id)
    ) AS total_messages_count,
    (
      SELECT COUNT(DISTINCT DATE(agl.created_at))
      FROM public.ai_generation_logs AS agl
      WHERE agl.user_id = u.id
    ) AS active_days_count
  FROM
    auth.users u
  LEFT JOIN
    public.profiles p ON u.id = p.id
  ORDER BY
    full_name;
$$;