-- ============================================
-- Migration: platform_logins (Logins de Plataformas)
-- ============================================

CREATE TABLE IF NOT EXISTS platform_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_logins_platform ON platform_logins(platform_name);

-- RLS
ALTER TABLE platform_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform logins are viewable by everyone" ON platform_logins FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert platform_logins" ON platform_logins FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update platform_logins" ON platform_logins FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete platform_logins" ON platform_logins FOR DELETE USING (auth.role() = 'authenticated');
