-- ============================================
-- MIGRAÇÃO: Múltiplos PDFs por videoaula
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar coluna pdf_urls (array) à tabela videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS pdf_urls TEXT[] DEFAULT '{}';

-- Backfill: preencher pdf_urls a partir do pdf_url existente
UPDATE videos
SET pdf_urls = ARRAY[pdf_url]
WHERE pdf_url IS NOT NULL
  AND pdf_url != ''
  AND (pdf_urls IS NULL OR array_length(pdf_urls, 1) IS NULL);

UPDATE videos SET pdf_urls = '{}' WHERE pdf_urls IS NULL;
