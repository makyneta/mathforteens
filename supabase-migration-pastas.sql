-- ============================================
-- MIGRAÇÃO: Criar sistema de pastas para videoaulas
-- Execute no Supabase SQL Editor
-- ============================================

-- Criar tabela de pastas
CREATE TABLE IF NOT EXISTS folders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  grade       TEXT NOT NULL,
  "order"     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna folder_id nos vídeos (nullable para compatibilidade)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Índices para navegação
CREATE INDEX IF NOT EXISTS idx_folders_subject_grade ON folders(subject, grade);
CREATE INDEX IF NOT EXISTS idx_videos_folder ON videos(folder_id);

-- RLS: leitura pública, escrita apenas para autenticados
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_select_public" ON folders FOR SELECT USING (true);
CREATE POLICY "folders_insert_auth" ON folders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "folders_update_auth" ON folders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "folders_delete_auth" ON folders FOR DELETE USING (auth.role() = 'authenticated');
