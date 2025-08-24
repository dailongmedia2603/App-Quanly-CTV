-- Tạo hoặc cập nhật cron job chạy mỗi 5 phút, lần này có kèm Authorization header
SELECT cron.schedule(
  'keep-tracking-functions-warm',
  '*/5 * * * *',
  $$
  -- Ping hàm track-email-open với Authorization header
  SELECT net.http_get(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-open',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImV4cCI6MjA3MDU2NDgzMH0.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64"}'::jsonb
  );
  -- Ping hàm track-email-click với Authorization header
  SELECT net.http_get(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-click?redirect_url=https://google.com',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImV4cCI6MjA3MDU2NDgzMH0.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64"}'::jsonb
  );
  $$
);