-- Add a column to store user facebook api proxies
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS user_facebook_api_proxies JSONB DEFAULT '[]'::jsonb;

-- Create or replace the function to get the next proxy in a round-robin fashion
CREATE OR REPLACE FUNCTION public.get_next_user_facebook_proxy()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proxies jsonb;
  proxy_count int;
  last_index int;
  next_index int;
  next_proxy jsonb;
BEGIN
  -- 1. Get the list of proxies from app_settings
  SELECT user_facebook_api_proxies INTO proxies FROM public.app_settings WHERE id = 1;

  -- If no proxies are configured or the list is empty, return null
  IF proxies IS NULL OR jsonb_array_length(proxies) = 0 THEN
    RETURN NULL;
  END IF;

  proxy_count := jsonb_array_length(proxies);

  -- 2. Get the last used index for this service, or initialize if not present
  SELECT last_used_index INTO last_index
  FROM public.api_key_usage
  WHERE service = 'user_facebook_proxy';

  IF NOT FOUND THEN
    -- Initialize the record if it doesn't exist
    INSERT INTO public.api_key_usage (service, last_used_index) VALUES ('user_facebook_proxy', -1)
    ON CONFLICT (service) DO NOTHING;
    last_index := -1;
  END IF;

  -- 3. Calculate the next index using round-robin
  next_index := (COALESCE(last_index, -1) + 1) % proxy_count;

  -- 4. Update the last used index in the database
  UPDATE public.api_key_usage
  SET last_used_index = next_index
  WHERE service = 'user_facebook_proxy';

  -- 5. Get the proxy at the new index
  next_proxy := proxies -> next_index;

  RETURN next_proxy;
END;
$$;