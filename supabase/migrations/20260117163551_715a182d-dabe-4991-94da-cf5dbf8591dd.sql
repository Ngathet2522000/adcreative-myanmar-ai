-- Create gemini_sessions table to track user-provided API keys
CREATE TABLE public.gemini_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemini_api_key TEXT NOT NULL,
  label TEXT DEFAULT 'Gemini User',
  is_converted_to_system_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gemini_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for gemini_sessions" ON public.gemini_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for gemini_sessions" ON public.gemini_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public update for gemini_sessions" ON public.gemini_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for gemini_sessions" ON public.gemini_sessions FOR DELETE USING (true);