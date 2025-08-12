-- Add a column to hide logs from the admin history view without deleting them
ALTER TABLE public.ai_generation_logs
ADD COLUMN is_hidden_in_admin_history BOOLEAN DEFAULT FALSE;

-- Add a comment for clarity
COMMENT ON COLUMN public.ai_generation_logs.is_hidden_in_admin_history IS 'If true, the log is hidden from the admin-facing history view but still exists for the user.';