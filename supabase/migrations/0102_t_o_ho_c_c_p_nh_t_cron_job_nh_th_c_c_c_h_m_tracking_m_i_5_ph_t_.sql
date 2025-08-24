-- Tạo hoặc cập nhật cron job chạy mỗi 5 phút
SELECT cron.schedule(
  'keep-tracking-functions-warm',
  '*/5 * * * *',
  $$
  -- Ping hàm track-email-open
  SELECT net.http_get(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-open'
  );
  -- Ping hàm track-email-click với một redirect_url giả để nó không báo lỗi
  SELECT net.http_get(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-click?redirect_url=https://google.com'
  );
  $$
);