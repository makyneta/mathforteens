-- ============================================
-- Math For Teens — Supabase Schema
-- ============================================

-- 1. TABELA: videos (Videoaulas do YouTube)
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  topic TEXT,
  pdf_url TEXT,
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: testimonials (Testemunhos)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT,
  content TEXT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5 CHECK (rating IN (1,1.5,2,2.5,3,3.5,4,4.5,5)),
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  category TEXT NOT NULL DEFAULT 'aulas',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: products (Produtos da Loja)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL DEFAULT 'outro',
  image_url TEXT,
  download_url TEXT,
  external_url TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: site_config (Configurações do site)
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(featured);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos("order");
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(active);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials("order");
CREATE INDEX IF NOT EXISTS idx_testimonials_category ON testimonials(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (leitura para todos)
CREATE POLICY "Videos are viewable by everyone" ON videos FOR SELECT USING (true);
CREATE POLICY "Testimonials are viewable by everyone" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Site config is viewable by everyone" ON site_config FOR SELECT USING (true);

-- Políticas de admin (escrita apenas para utilizadores autenticados)
CREATE POLICY "Authenticated users can insert videos" ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update videos" ON videos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete videos" ON videos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert testimonials" ON testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update testimonials" ON testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete testimonials" ON testimonials FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert site_config" ON site_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update site_config" ON site_config FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- DADOS INICIAIS (Opcional - para teste)
-- ============================================

-- Vídeos de exemplo
INSERT INTO videos (title, description, youtube_url, topic, featured, "order") VALUES
('Introdução a Derivadas', 'Aprenda os conceitos básicos de derivadas de forma simples.', 'https://www.youtube.com/watch?v=EXEMPLE1', 'Derivadas', true, 1),
('Equações do 2.º Grau', 'Como resolver equações do segundo grau passo a passo.', 'https://www.youtube.com/watch?v=EXEMPLE2', 'Álgebra', false, 2),
('Funções Trigonométricas', 'Explicação completa de seno, cosseno e tangente.', 'https://www.youtube.com/watch?v=EXEMPLE3', 'Trigonometria', false, 3)
ON CONFLICT DO NOTHING;

-- Testemunhos de exemplo
INSERT INTO testimonials (author_name, author_role, content, rating, active, "order") VALUES
('Ana Silva', 'Aluna do 10.º ano', 'Graças às explicações do Tomás, passei de 10 a 18 a Matemática!', 5, true, 1),
('Carlos Santos', 'Pai de aluno', 'O meu filho melhorou imenso desde que começou as aulas. Recomendo!', 4.5, true, 2),
('Maria Ferreira', 'Aluna do 12.º ano', 'As aulas são muito claras e o apoio no WhatsApp é incrível.', 5, true, 3)
ON CONFLICT DO NOTHING;

-- Produtos de exemplo
INSERT INTO products (name, slug, description, long_description, price, original_price, category, featured, active, "order") VALUES
('Crónicas d''Adolescente', 'cronicas-d-adolescente', 'O livro de Tomás Correia sobre a experiência de obter 100% no exame.', 'Um relato real e inspirador de como um adolescente português conseguiu a nota máxima na Prova Final de Ciclo de Matemática. Com dicas práticas, motivação e história pessoal.', 12.99, 15.99, 'livro', true, true, 1),
('Resumo de Derivadas', 'resumo-derivadas', 'Resumo completo de derivadas para o exame.', 'Resumo em PDF com todos os conceitos, fórmulas e exercícios resolvidos de derivadas. Ideal para revisão de exame.', 4.99, null, 'resumo', true, true, 2),
('Ficha de Exercícios - Álgebra', 'ficha-exercicios-algebra', '50 exercícios resolvidos de álgebra.', 'Ficha completa com 50 exercícios de álgebra, desde o básico ao avançado, com resolução passo a passo.', 3.99, null, 'ficha', false, true, 3)
ON CONFLICT DO NOTHING;

-- Configurações iniciais
INSERT INTO site_config (key, value) VALUES
('site_name', 'Math For Teens'),
('contact_email', 'mathforteens@gmail.com'),
('whatsapp_number', '351910256373')
ON CONFLICT (key) DO NOTHING;
