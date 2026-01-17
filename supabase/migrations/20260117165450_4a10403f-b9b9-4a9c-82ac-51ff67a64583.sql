-- Add is_premium column to users table
ALTER TABLE public.users ADD COLUMN is_premium boolean NOT NULL DEFAULT false;

-- Add is_premium column to gemini_sessions table
ALTER TABLE public.gemini_sessions ADD COLUMN is_premium boolean NOT NULL DEFAULT false;

-- Insert tier limit settings
INSERT INTO public.settings (key, value) VALUES ('free_daily_limit', '5');
INSERT INTO public.settings (key, value) VALUES ('premium_daily_limit', '100');