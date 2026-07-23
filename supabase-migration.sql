-- ============================================
-- MIGRAÇÃO: Adicionar draft + Storage PDFs
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Adicionar campo draft à tabela videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS draft BOOLEAN DEFAULT false;

-- 2. Criar bucket para PDFs no Supabase Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT DO NOTHING;

-- 3. Políticas de acesso ao bucket pdfs (leitura pública)
CREATE POLICY "PDFs are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');

-- 4. Políticas de upload (apenas autenticados)
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

-- 5. Políticas de delete (apenas autenticados)
CREATE POLICY "Authenticated users can delete PDFs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
