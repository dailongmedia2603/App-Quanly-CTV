-- Add a new column for multiple service IDs, if it doesn't already exist
ALTER TABLE public.consulting_sessions
ADD COLUMN IF NOT EXISTS service_ids UUID[];

-- Migrate data from the old single service_id column to the new array column
-- This ensures existing chats are compatible with the new system
UPDATE public.consulting_sessions
SET service_ids = ARRAY[service_id]
WHERE service_id IS NOT NULL AND (service_ids IS NULL OR array_length(service_ids, 1) IS NULL);