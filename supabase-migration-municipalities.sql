-- ============================================
-- Math For Teens — Mapa de Presença
-- Conselhos/concelhos onde já houve alunos
-- ============================================

CREATE TABLE IF NOT EXISTS student_municipalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_student_municipalities_municipality_district UNIQUE (municipality, district)
);

ALTER TABLE student_municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Municipalities are viewable by everyone"
  ON student_municipalities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert municipalities"
  ON student_municipalities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update municipalities"
  ON student_municipalities FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete municipalities"
  ON student_municipalities FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_student_municipalities_district ON student_municipalities(district);
CREATE INDEX IF NOT EXISTS idx_student_municipalities_municipality ON student_municipalities(municipality);
