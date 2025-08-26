-- Remove Vertex AI related database objects
DROP FUNCTION IF EXISTS public.get_next_gemini_api_key();
DROP TABLE IF EXISTS public.api_key_usage;

-- Add new columns for MultiApp AI
ALTER TABLE public.app_settings
ADD COLUMN multiappai_api_url TEXT,
ADD COLUMN multiappai_api_key TEXT;

-- Rename gemini_model to be more generic
ALTER TABLE public.app_settings
RENAME COLUMN gemini_model TO ai_model_name;

-- Remove old gemini_api_keys column as it's no longer used
ALTER TABLE public.app_settings
DROP COLUMN IF EXISTS gemini_api_keys;

-- Set a default value for the new URL and API Key as requested
UPDATE public.app_settings
SET 
  multiappai_api_url = 'https://multiappai-api.itmovnteam.com/v1',
  multiappai_api_key = 'sk-EWcoOk8zZtfGel2Utawq3Y09Wrf9m6A3u1XzvtafHDaEPJhX'
WHERE id = 1;