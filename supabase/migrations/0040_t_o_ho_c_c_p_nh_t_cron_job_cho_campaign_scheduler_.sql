-- Lệnh này sẽ tạo job nếu chưa có, hoặc cập nhật job nếu đã tồn tại.
SELECT cron.schedule(
    'invoke-campaign-scheduler',
    '* * * * *',
    $$
    SELECT net.http_post(
        url:='https://vigjnshinceevqbcvdpj.supabase.co/functions/v1/campaign-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImV4cCI6MjA3MDU2NDgzMH0.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64"}'::jsonb,
        body:='{"name":"Functions"}'::jsonb
    ) AS request_id;
    $$
);