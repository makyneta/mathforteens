-- ============================================
-- Math For Teens — Chatbot Tables
-- ============================================

-- 1. TABELA: chatbot_faq (Perguntas Frequentes do Chatbot)
CREATE TABLE IF NOT EXISTS chatbot_faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT[] NOT NULL,
  answer TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: chatbot_conversations (Registo de conversas)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  matched BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_active ON chatbot_faq(active);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_order ON chatbot_faq("order");
CREATE INDEX IF NOT EXISTS idx_conv_session ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conv_created ON chatbot_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conv_matched ON chatbot_conversations(matched);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE chatbot_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (leitura para todos)
CREATE POLICY "FAQ is viewable by everyone" ON chatbot_faq FOR SELECT USING (true);

-- Políticas de admin (escrita apenas para utilizadores autenticados)
CREATE POLICY "Authenticated users can insert FAQ" ON chatbot_faq FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update FAQ" ON chatbot_faq FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete FAQ" ON chatbot_faq FOR DELETE USING (auth.role() = 'authenticated');

-- Conversas: permitir insert anónimo (para logging do chatbot)
CREATE POLICY "Anyone can insert conversations" ON chatbot_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view conversations" ON chatbot_conversations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete conversations" ON chatbot_conversations FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- DADOS INICIAIS
-- ============================================
INSERT INTO chatbot_faq (keywords, answer, "order") VALUES
  (ARRAY['ola', 'olá', 'bom dia', 'boa tarde', 'oi', 'hey'], 'Olá! 👋 Sou o assistente da Math For Teens. Como posso ajudar? Pergunta-me sobre os cursos, o Tomás, ou como começar.', 1),
  (ARRAY['curso', 'aula', 'exame', 'preparação', 'estudar', 'explicação'], 'Temos cursos de preparação para exames nacionais:\n\n📐 **Matemática (9.º ano)** — 21 aulas (12€–18€)\n🧬 **Biologia e Geologia (11.º)** — 29 aulas (21€–28€)\n⚛️ **Física e Química A** — 24 aulas (14€–28€)\n📖 **Crónicas d''Adolescente** — livro autografado (17€)\n\nCada aula inclui acesso ao Classroom com fichas, resumos, exames de anos anteriores e grupo de WhatsApp.', 2),
  (ARRAY['preço', 'preco', 'custo', 'quanto', '€', 'euro', 'pagar', 'caro', 'barato'], 'Os preços variam por curso:\n• Matemática 9.º: 12€–18€ por aula (algumas em promoção a 9€)\n• BG: 21€–28€ por aula\n• FQA: 14€–28€ por aula\n• Livro: 17€ (autografado)\n\nPodes adicionar ao carrinho e finalizar via WhatsApp.', 3),
  (ARRAY['tomas', 'tomás', 'correia', 'fundador', 'quem', 'criador'], 'O Tomás Correia tem 16 anos, é estudante de Ciências e Tecnologias e fundou o Math For Teens em 2024. Obteve 100% no exame de Matemática (9.º ano) em 2024 e publicou o livro "Crónicas d''Adolescente" em 2025. Começou a dar mentorias aos 11 anos!', 4),
  (ARRAY['whatsapp', 'contacto', 'contactar', 'telefone', 'falar', 'ligar'], 'Podes falar connosco pelo WhatsApp: **+351 910 256 373** ou visitar a [página de contacto](contacto.html).\n\nEmail: geral@mathforteens.pt\n\nRespondemos rápido! 💬', 5),
  (ARRAY['comprar', 'encomendar', 'pedido', 'carrinho', 'checkout', 'adquirir'], 'Para comprar:\n1. Escolhe o teu curso na [página de contacto](contacto.html)\n2. Envia-nos uma mensagem\n3. Combinamos tudo e enviamos os detalhes de pagamento\n4. Recebes acesso ao Classroom e materiais\n\nSimples e seguro! ✅', 6),
  (ARRAY['pagamento', 'mbway', 'transferência', 'transferencia', 'paypal', 'como pagar', 'banco'], 'O pagamento é combinado diretamente após finalizares o pedido no WhatsApp. Aceitamos MB Way e transferência bancária. Enviamos-te todas as instruções quando confirmares a encomenda.', 7),
  (ARRAY['classroom', 'google', 'materiais', 'fichas', 'resumos', 'material'], 'Sim! Cada aula inclui acesso a um Google Classroom com:\n📄 Fichas de trabalho\n📝 Resumos da matéria\n📋 Provas-modelo\n📚 Exames nacionais de anos anteriores\n💬 Grupo de WhatsApp para dúvidas', 8),
  (ARRAY['livro', 'cronicas', 'crónicas', 'adolescente', 'chiado'], '"Crónicas d''Adolescente" é uma coletânea de crónicas sobre a adolescência escrita pelo Tomás e publicada em 2025 pela Chiado Books. O exemplar é autografado e custa 17€.', 9),
  (ARRAY['instagram', 'youtube', 'tiktok', 'redes', 'seguir', 'redes sociais'], 'Segue-nos nas redes sociais:\n📸 Instagram: @mathforteenss\n▶️ YouTube: @Mathforteens\n🎵 TikTok: @mathforteenss', 10),
  (ARRAY['obrigado', 'obrigada', 'valeu', 'thanks', 'obg'], 'De nada! 😊 Se precisares de mais ajuda, é só chamar. Boa sorte nos estudos! 🚀', 11),
  (ARRAY['disciplina', 'matemática', 'matematica', 'fisica', 'física', 'quimica', 'química', 'biologia', 'geologia', 'português', 'portugues', 'filosofia', 'economia'], 'As disciplinas disponíveis:\n📐 Matemática (7.º–12.º)\n🧬 Biologia e Geologia (10.º–11.º)\n⚛️ Física e Química A (10.º–11.º)\n📖 Português\n🧠 Filosofia\n📊 Economia\n\nEscolhe a tua e marca uma aula experimental!', 12),
  (ARRAY['experimental', 'experimentar', 'primeira aula', 'gratis', 'grátis', 'gratuito', 'amostra'], 'Sim! Podes marcar uma **aula experimental gratuita** sem compromisso. Fala connosco pelo WhatsApp ou na [página de contacto](contacto.html) para agendarmos. 🎯', 13),
  (ARRAY['horario', 'horário', 'disponibilidade', 'quando', 'agendar', 'marcar'], 'As aulas são online e os horários são flexíveis. Combina diretamente connosco pelo WhatsApp ou através da [página de contacto](contacto.html). Adaptamo-nos à tua disponibilidade! 📅', 14),
  (ARRAY['presencial', 'online', 'presenciais', 'zoom', 'meet', 'vídeo', 'videochamada'], 'Todas as aulas são **online**, por videochamada. Recebes o link após confirmação. Assim podes aprender onde estiveres, no teu ritmo. 💻', 15)
ON CONFLICT DO NOTHING;
