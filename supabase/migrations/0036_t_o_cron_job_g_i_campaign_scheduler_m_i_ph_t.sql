SELECT cron.schedule(
  'invoke-campaign-scheduler-every-minute', -- Tên của cron job
  '* * * * *', -- Lịch trình: chạy mỗi phút
  $$
  SELECT
    net.http_post(
      url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/campaign-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_SERVICE_ROLE_KEY]"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);