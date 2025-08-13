ALTER TABLE public.document_post_types
ADD COLUMN word_count INTEGER;

COMMENT ON COLUMN public.document_post_types.word_count IS 'Suggested word count for this type of post.';