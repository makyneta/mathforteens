const FAQ = [
  { keywords: ['ola', 'olá', 'bom dia', 'boa tarde', 'oi', 'hey'], answer: 'Olá! 👋 Sou o assistente da Math For Teens. Como posso ajudar? Pergunta-me sobre os cursos, o Tomás, ou como começar.' },
  { keywords: ['curso', 'aula', 'exame', 'preparação', 'estudar'], answer: 'Temos cursos de preparação para exames nacionais:\n\n📐 **Matemática (9.º ano)** — 21 aulas (12€–18€)\n🧬 **Biologia e Geologia (11.º)** — 29 aulas (21€–28€)\n⚛️ **Física e Química A** — 24 aulas (14€–28€)\n📖 **Crónicas d\'Adolescente** — livro autografado (17€)\n\nCada aula inclui acesso ao Classroom com fichas, resumos, exames de anos anteriores e grupo de WhatsApp.' },
  { keywords: ['preço', 'preco', 'custo', 'quanto', '€', 'euro', 'pagar'], answer: 'Os preços variam por curso:\n• Matemática 9.º: 12€–18€ por aula (algumas em promoção a 9€)\n• BG: 21€–28€ por aula\n• FQA: 14€–28€ por aula\n• Livro: 17€ (autografado)\n\nPodes adicionar ao carrinho e finalizar via WhatsApp.' },
  { keywords: ['tomas', 'tomás', 'correia', 'fundador', 'quem'], answer: 'O Tomás Correia tem 16 anos, é estudante de Ciências e Tecnologias e fundou o Math For Teens em 2024. Obteve 100% no exame de Matemática (9.º ano) em 2024 e publicou o livro "Crónicas d\'Adolescente" em 2025. Começou a dar mentorias aos 11 anos!' },
  { keywords: ['whatsapp', 'contacto', 'contactar', 'telefone', 'falar'], answer: 'Podes falar connosco pelo WhatsApp: **+351 910 256 373** ou visitar a [página de contacto](contacto.html).\n\nEmail: geral@mathforteens.pt\n\nRespondemos rápido! 💬' },
  { keywords: ['comprar', 'encomendar', 'pedido', 'carrinho', 'checkout'], answer: 'Para comprar:\n1. Escolhe o teu curso na [página de contacto](contacto.html)\n2. Envia-nos uma mensagem\n3. Combinamos tudo e enviamos os detalhes de pagamento\n4. Recebes acesso ao Classroom e materiais\n\nSimples e seguro! ✅' },
  { keywords: ['pagamento', 'mbway', 'transferência', 'paypal', 'como pagar'], answer: 'O pagamento é combinado diretamente após finalizares o pedido no WhatsApp. Aceitamos MB Way e transferência bancária. Enviamos-te todas as instruções quando confirmares a encomenda.' },
  { keywords: ['classroom', 'google', 'materiais', 'fichas', 'resumos'], answer: 'Sim! Cada aula inclui acesso a um Google Classroom com:\n📄 Fichas de trabalho\n📝 Resumos da matéria\n📋 Provas-modelo\n📚 Exames nacionais de anos anteriores\n💬 Grupo de WhatsApp para dúvidas' },
  { keywords: ['livro', 'cronicas', 'crónicas', 'adolescente'], answer: '"Crónicas d\'Adolescente" é uma coletânea de crónicas sobre a adolescência escrita pelo Tomás e publicada em 2025 pela Chiado Books. O exemplar é autografado e custa 17€.' },
  { keywords: ['instagram', 'youtube', 'tiktok', 'redes', 'seguir'], answer: 'Segue-nos nas redes sociais:\n📸 Instagram: @mathforteenss\n▶️ YouTube: @Mathforteens\n🎵 TikTok: @mathforteenss' },
  { keywords: ['obrigado', 'obrigada', 'valeu', 'thanks'], answer: 'De nada! 😊 Se precisares de mais ajuda, é só chamar. Boa sorte nos estudos! 🚀' },
]

function responder(pergunta) {
  const p = pergunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const faq of FAQ) {
    if (faq.keywords.some(k => p.includes(k))) return faq.answer
  }
  return 'Ainda não sei responder a isso. 😅 Tenta perguntar sobre os cursos, preços, o Tomás, ou como comprar. Ou se preferes, fala connosco diretamente no WhatsApp! 💬'
}

function initChatbot() {
  const toggle = document.getElementById('chatbotToggle')
  const window = document.getElementById('chatbotWindow')
  const msgs = document.getElementById('chatbotMsgs')
  const input = document.getElementById('chatbotInput')
  const send = document.getElementById('chatbotSend')

  if (!toggle || !window) return

  let isOpen = false

  function abrir() {
    isOpen = true
    window.classList.add('open')
    toggle.classList.add('close')
    toggle.textContent = '✕'
  }

  function fechar() {
    isOpen = false
    window.classList.remove('open')
    toggle.classList.remove('close')
    toggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  }

  toggle.addEventListener('click', () => isOpen ? fechar() : abrir())

  function addMsg(texto, tipo) {
    const div = document.createElement('div')
    div.className = `chatbot-msg ${tipo}`
    div.textContent = texto
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
  }

  function showOptions() {
    const existing = msgs.querySelector('.chatbot-options')
    if (existing) return
    const container = document.createElement('div')
    container.className = 'chatbot-options'
    const sugestoes = ['Cursos e Preços', 'Como Comprar', 'Quem é o Tomás', 'WhatsApp']
    sugestoes.forEach(s => {
      const btn = document.createElement('button')
      btn.className = 'chatbot-option'
      btn.textContent = s
      btn.addEventListener('click', () => {
        container.remove()
        handleUserInput(s)
      })
      container.appendChild(btn)
    })
    msgs.appendChild(container)
    msgs.scrollTop = msgs.scrollHeight
  }

  function showTyping() {
    const div = document.createElement('div')
    div.className = 'chatbot-typing'
    div.id = 'chatbotTyping'
    div.innerHTML = '<span></span><span></span><span></span>'
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
    return div
  }

  window.handleUserInput = function(texto) {
    if (!texto.trim()) return
    addMsg(texto, 'user')
    const typing = showTyping()
    setTimeout(() => {
      typing.remove()
      const resposta = responder(texto)
      addMsg(resposta, 'bot')
      showOptions()
    }, 600 + Math.random() * 400)
  }

  send.addEventListener('click', () => {
    handleUserInput(input.value)
    input.value = ''
  })

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      handleUserInput(input.value)
      input.value = ''
    }
  })

  const btnChatOptions = document.querySelectorAll('.chatbot-option')
}
