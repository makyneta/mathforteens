-- ============================================
-- MIGRAÇÃO: Avaliações com meias estrelas
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Alterar a coluna rating para aceitar valores numéricos
--    (inteiro → decimal) e permitir meias estrelas (1, 1.5, 2, 2.5, ... 5)
ALTER TABLE testimonials
  ALTER COLUMN rating TYPE NUMERIC(2,1)
  USING rating::numeric;

-- 2. Garantir que só são aceites valores válidos (1 a 5, passos de 0.5)
DO $$
BEGIN
  -- Remove o constraint antigo (se existir)
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_rating_check'
  ) THEN
    ALTER TABLE testimonials DROP CONSTRAINT testimonials_rating_check;
  END IF;

  -- Remove qualquer constraint de check com nome genérico gerado automaticamente
  ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_rating_check1;
END $$;

ALTER TABLE testimonials
  ADD CONSTRAINT testimonials_rating_check
  CHECK (rating IN (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5));
