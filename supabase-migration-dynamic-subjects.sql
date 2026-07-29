-- ============================================
-- Migration: Dynamic Subjects & Grades
-- Cria tabelas subjects e subject_grades
-- Permite criar/editar/apagar disciplinas e anos
-- ============================================

-- Subjects (disciplinas)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#0E8C8F',
  icon_index INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subject grades (anos escolares por disciplina)
CREATE TABLE IF NOT EXISTS subject_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id, grade)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subject_grades_subject_id ON subject_grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_display_order ON subjects(display_order);
CREATE INDEX IF NOT EXISTS idx_subject_grades_display_order ON subject_grades(display_order);

-- RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_grades ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Subjects public read" ON subjects;
CREATE POLICY "Subjects public read" ON subjects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Subject_grades public read" ON subject_grades;
CREATE POLICY "Subject_grades public read" ON subject_grades
  FOR SELECT USING (true);

-- Authenticated (admin) full access
DROP POLICY IF EXISTS "Subjects admin all" ON subjects;
CREATE POLICY "Subjects admin all" ON subjects
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Subject_grades admin all" ON subject_grades;
CREATE POLICY "Subject_grades admin all" ON subject_grades
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed data (existing subjects)
INSERT INTO subjects (name, color, icon_index, display_order) VALUES
  ('Matemática', '#0E8C8F', 0, 0),
  ('Matemática A', '#F9E87A', 1, 1),
  ('Matemática B', '#1A3840', 2, 2)
ON CONFLICT (name) DO NOTHING;

-- Seed grades
INSERT INTO subject_grades (subject_id, grade, display_order)
SELECT id, '7.º Ano', 0 FROM subjects WHERE name = 'Matemática'
UNION ALL
SELECT id, '8.º Ano', 1 FROM subjects WHERE name = 'Matemática'
UNION ALL
SELECT id, '9.º Ano', 2 FROM subjects WHERE name = 'Matemática'
UNION ALL
SELECT id, '10.º Ano', 0 FROM subjects WHERE name = 'Matemática A'
UNION ALL
SELECT id, '11.º Ano', 1 FROM subjects WHERE name = 'Matemática A'
UNION ALL
SELECT id, '12.º Ano', 2 FROM subjects WHERE name = 'Matemática A'
UNION ALL
SELECT id, '10.º Ano', 0 FROM subjects WHERE name = 'Matemática B'
UNION ALL
SELECT id, '11.º Ano', 1 FROM subjects WHERE name = 'Matemática B'
ON CONFLICT (subject_id, grade) DO NOTHING;
