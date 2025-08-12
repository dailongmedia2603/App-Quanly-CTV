CREATE POLICY "Users can view their own generation logs"
ON public.ai_generation_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);