-- Create daily_usage table to track generations per day
CREATE TABLE public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  gemini_session_id UUID REFERENCES public.gemini_sessions(id) ON DELETE CASCADE,
  api_key_hash TEXT,
  generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usage_date, user_id),
  UNIQUE(usage_date, gemini_session_id),
  UNIQUE(usage_date, api_key_hash)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for daily_usage" ON public.daily_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for daily_usage" ON public.daily_usage FOR SELECT USING (true);
CREATE POLICY "Allow public update for daily_usage" ON public.daily_usage FOR UPDATE USING (true);

-- Add daily_limit column to settings if needed (will use key-value approach)
INSERT INTO public.settings (key, value) VALUES ('daily_generation_limit', '50') ON CONFLICT (key) DO NOTHING;