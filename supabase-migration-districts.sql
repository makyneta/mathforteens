-- ============================================
-- Math For Teens — Mapa de Presença
-- Distritos e ilhas onde já houve alunos
-- ============================================

CREATE TABLE IF NOT EXISTS student_districts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE student_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are viewable by everyone"
  ON student_districts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert districts"
  ON student_districts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update districts"
  ON student_districts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete districts"
  ON student_districts FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_student_districts_district ON student_districts(district);
