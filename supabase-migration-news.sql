-- ============================================
-- Math For Teens — Notícias (News) Table
-- ============================================

CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are viewable by everyone" ON news FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert news" ON news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update news" ON news FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete news" ON news FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
