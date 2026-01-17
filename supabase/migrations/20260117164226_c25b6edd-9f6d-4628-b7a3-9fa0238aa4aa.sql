-- Add usage_count to gemini_sessions table
ALTER TABLE public.gemini_sessions ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;