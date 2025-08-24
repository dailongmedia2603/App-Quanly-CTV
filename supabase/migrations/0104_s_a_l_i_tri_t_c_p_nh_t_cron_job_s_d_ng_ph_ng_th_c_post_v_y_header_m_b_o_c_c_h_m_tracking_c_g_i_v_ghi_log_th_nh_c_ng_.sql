-- Hủy bỏ cron job cũ để đảm bảo thay đổi được áp dụng
SELECT cron.unschedule('keep-tracking-functions-warm');

-- Tạo cron job mới, sử dụng POST và đầy đủ header
SELECT cron.schedule(
  'keep-tracking-functions-warm',
  '*/5 * * * *',
  $$
  -- Ping hàm track-email-open
  SELECT net.http_post(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-open',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImV4cCI6MjA3MDU2NDgzMH0.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  -- Ping hàm track-email-click
  SELECT net.http_post(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-click?redirect_url=https://google.com',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImV4cCI6MjA3MDU2NDgzMH0.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);