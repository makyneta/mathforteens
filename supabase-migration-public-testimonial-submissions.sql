-- ============================================
-- MIGRAÇÃO: Submissões públicas de testemunhos
-- Permite que qualquer visitante deixe um testemunho
-- pelo site. O testemunho vai automaticamente para a
-- secção de testemunhos do livro (category = 'livro'),
-- fica ativo (active = true) e aparece no admin.
-- Execute este SQL no Supabase SQL Editor.
-- ============================================

-- 1. Função RPC segura (SECURITY DEFINER) para inserir testemunhos
--    Sem auth exigida: valida os dados, publica de imediato na
--    categoria do livro e permite apenas as categorias existentes
--    (aulas | livro).
CREATE OR REPLACE FUNCTION public.submit_testimonial(
  p_author_name TEXT,
  p_author_role TEXT DEFAULT NULL,
  p_content TEXT,
  p_rating NUMERIC DEFAULT 5,
  p_category TEXT DEFAULT 'livro'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validações de entrada
  IF p_author_name IS NULL OR length(btrim(p_author_name)) = 0 THEN
    RAISE EXCEPTION 'Nome do autor é obrigatório';
  END IF;

  IF p_content IS NULL OR length(btrim(p_content)) < 10 THEN
    RAISE EXCEPTION 'O testemunho é demasiado curto';
  END IF;

  IF p_category IS NULL OR p_category NOT IN ('aulas', 'livro') THEN
    p_category := 'livro';
  END IF;

  -- Avaliação normalizada para múltiplos de 0.5 (respeita o CHECK da coluna)
  IF p_rating IS NULL THEN
    p_rating := 5;
  ELSE
    p_rating := GREATEST(1, LEAST(5, round(p_rating * 2) / 2));
  END IF;

  INSERT INTO testimonials (
    author_name,
    author_role,
    content,
    rating,
    category,
    active,
    "order"
  )
  VALUES (
    left(btrim(p_author_name), 80),
    NULLIF(left(btrim(p_author_role), 80), ''),
    left(btrim(p_content), 600),
    p_rating,
    p_category,
    true,
    (SELECT COALESCE(MAX("order"), 0) + 1 FROM testimonials WHERE category = p_category)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 2. Permitir execução aos utilizadores anónimos (visitantes do site)
REVOKE EXECUTE ON FUNCTION public.submit_testimonial(TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_testimonial(TEXT, TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated;
