-- ============================================
-- MIGRAÇÃO: Categoria de testemunhos (aulas | livro)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Adicionar campo category à tabela testimonials
--    'aulas' = feedback das aulas · 'livro' = feedback do livro
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'aulas';

-- 2. Índice para filtrar por categoria
CREATE INDEX IF NOT EXISTS idx_testimonials_category ON testimonials(category);
