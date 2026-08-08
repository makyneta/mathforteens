-- ============================================
-- Math For Teens — CRM de Gestão de Aulas
-- Execute este SQL no Supabase SQL Editor
--
-- Tabelas: crm_students, crm_lessons, crm_tasks, crm_notes
-- Acesso restrito a utilizadores autenticados (admin)
--
-- NOTA: Se tinhas executado a migração anterior (funil de
-- vendas), este script remove as tabelas crm_contacts e
-- crm_stages automaticamente. Os dados daí existentes não
-- são migrados.
-- ============================================

-- 1. TABELA: crm_students (Alunos)
CREATE TABLE IF NOT EXISTS crm_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  grade TEXT,
  school TEXT,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'outro',
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT true,
  last_lesson_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA: crm_lessons (Aulas)
CREATE TABLE IF NOT EXISTS crm_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES crm_students(id) ON DELETE CASCADE,
  subject TEXT,
  grade TEXT,
  topic TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'agendada',
  paid BOOLEAN NOT NULL DEFAULT false,
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Limpeza da versão anterior (funil de vendas)
DROP TABLE IF EXISTS crm_contacts CASCADE;
DROP TABLE IF EXISTS crm_stages CASCADE;

-- 4. TABELA: crm_tasks (Tarefas / follow-ups)
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES crm_students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELA: crm_notes (Notas / histórico por aluno)
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES crm_students(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_crm_students_status ON crm_students(status);
CREATE INDEX IF NOT EXISTS idx_crm_students_created ON crm_students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_lessons_student ON crm_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_crm_lessons_starts ON crm_lessons(starts_at);
CREATE INDEX IF NOT EXISTS idx_crm_lessons_status ON crm_lessons(status);
CREATE INDEX IF NOT EXISTS idx_crm_lessons_paid ON crm_lessons(paid);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_student ON crm_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON crm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_done ON crm_tasks(done);
CREATE INDEX IF NOT EXISTS idx_crm_notes_student ON crm_notes(student_id);

-- ============================================
-- RLS (Row Level Security)
-- Dados de alunos são confidenciais: apenas
-- utilizadores autenticados (admin) acedem.
-- ============================================
ALTER TABLE crm_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM students: authenticated full access" ON crm_students
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "CRM lessons: authenticated full access" ON crm_lessons
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "CRM tasks: authenticated full access" ON crm_tasks
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "CRM notes: authenticated full access" ON crm_notes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
