-- Users table for access key authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  access_key TEXT NOT NULL UNIQUE,
  gemini_api_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generations history table
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  keywords TEXT,
  additional_context TEXT,
  content_length TEXT NOT NULL DEFAULT 'medium',
  tone TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System keys pool for load balancing
CREATE TABLE public.system_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings table for admin config
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin password
INSERT INTO public.settings (key, value) VALUES ('admin_password', 'admin123');
INSERT INTO public.settings (key, value) VALUES ('proxy_base_url', '');

-- Enable Row Level Security (public access for this app since it uses access keys, not Supabase auth)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Users policies - public access for access key auth system
CREATE POLICY "Allow public read for users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert for users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for users" ON public.users FOR DELETE USING (true);

-- Generations policies
CREATE POLICY "Allow public read for generations" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Allow public insert for generations" ON public.generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete for generations" ON public.generations FOR DELETE USING (true);

-- System keys policies (admin only access - secured via edge function)
CREATE POLICY "Allow public read for system_keys" ON public.system_keys FOR SELECT USING (true);
CREATE POLICY "Allow public insert for system_keys" ON public.system_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for system_keys" ON public.system_keys FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for system_keys" ON public.system_keys FOR DELETE USING (true);

-- Settings policies
CREATE POLICY "Allow public read for settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public update for settings" ON public.settings FOR UPDATE USING (true);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();