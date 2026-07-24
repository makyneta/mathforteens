-- ============================================
-- MIGRAÇÃO: Adicionar subject + grade aos vídeos
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar campo subject (Matemática, Matemática A, Matemática B)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Matemática';

-- Adicionar campo grade (7.º Ano, 8.º Ano, etc.)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '7.º Ano';

-- Atualizar vídeos existentes com valores padrão
UPDATE videos SET subject = 'Matemática' WHERE subject IS NULL;
UPDATE videos SET grade = '9.º Ano' WHERE grade IS NULL;

-- Índices para navegação por pastas
CREATE INDEX IF NOT EXISTS idx_videos_subject ON videos(subject);
CREATE INDEX IF NOT EXISTS idx_videos_grade ON videos(grade);
CREATE INDEX IF NOT EXISTS idx_videos_subject_grade ON videos(subject, grade);
