SELECT cron.schedule(
  'invoke-campaign-scheduler-every-minute', -- Tên của cron job
  '* * * * *', -- Lịch trình: chạy mỗi phút
  $$
  SELECT
    net.http_post(
      url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/campaign-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [DÁN SERVICE_ROLE_KEY CỦA BẠN VÀO ĐÂY]"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);