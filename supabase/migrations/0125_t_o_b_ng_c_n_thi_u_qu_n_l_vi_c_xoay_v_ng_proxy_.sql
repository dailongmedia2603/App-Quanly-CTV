-- Create the missing table to track proxy usage
CREATE TABLE public.api_key_usage (
  service TEXT PRIMARY KEY,
  last_used_index INT NOT NULL DEFAULT -1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for the new table
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow the system to manage proxy usage
CREATE POLICY "Allow authenticated users to manage usage" ON public.api_key_usage
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);