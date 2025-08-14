-- Step 1: Modify app_settings table to store an array of keys
ALTER TABLE public.app_settings ADD COLUMN gemini_api_keys TEXT[];
UPDATE public.app_settings SET gemini_api_keys = ARRAY[gemini_api_key] WHERE gemini_api_key IS NOT NULL AND gemini_api_key != '';
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS gemini_api_key;

-- Step 2: Create a table to track key usage for round-robin
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  service TEXT PRIMARY KEY,
  last_used_index INT NOT NULL DEFAULT -1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Seed the table for Gemini service
INSERT INTO public.api_key_usage (service, last_used_index) VALUES ('gemini', -1) ON CONFLICT (service) DO NOTHING;

-- Step 3: Create a database function to get the next key atomically
CREATE OR REPLACE FUNCTION get_next_gemini_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  keys TEXT[];
  key_count INT;
  next_index INT;
  selected_key TEXT;
BEGIN
  -- Get the API keys from the settings table
  SELECT gemini_api_keys INTO keys FROM public.app_settings WHERE id = 1;
  
  -- Filter out null or empty keys
  keys := array(SELECT unnest FROM unnest(keys) WHERE unnest IS NOT NULL AND unnest != '');

  -- If no valid keys are configured, return null
  IF keys IS NULL OR array_length(keys, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  key_count := array_length(keys, 1);
  
  -- Atomically update and get the next index
  UPDATE public.api_key_usage
  SET last_used_index = (last_used_index + 1) % key_count
  WHERE service = 'gemini'
  RETURNING last_used_index INTO next_index;
  
  -- Select the key using the new index (PostgreSQL arrays are 1-based)
  selected_key := keys[next_index + 1];
  
  RETURN selected_key;
END;
$$;