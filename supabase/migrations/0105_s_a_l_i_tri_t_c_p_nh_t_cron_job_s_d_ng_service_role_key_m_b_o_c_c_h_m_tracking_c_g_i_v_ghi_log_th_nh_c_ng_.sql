-- Hủy bỏ cron job cũ để đảm bảo thay đổi được áp dụng
SELECT cron.unschedule('keep-tracking-functions-warm');

-- Tạo cron job mới, sử dụng POST và service_role_key để đảm bảo quyền thực thi
SELECT cron.schedule(
  'keep-tracking-functions-warm',
  '*/5 * * * *',
  $$
  -- Ping hàm track-email-open
  SELECT net.http_post(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-open',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk4ODgzMCwiZXhwIjoyMDcwNTY0ODMwfQ.0-f2a5g2vbz2gVbrs0qd23u_so0brcVwz22aGyv2uA4", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  -- Ping hàm track-email-click
  SELECT net.http_post(
    url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/track-email-click?redirect_url=https://google.com',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk4ODgzMCwiZXhwIjoyMDcwNTY0ODMwfQ.0-f2a5g2vbz2gVbrs0qd23u_so0brcVwz22aGyv2uA4", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);