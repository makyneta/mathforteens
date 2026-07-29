document.addEventListener('DOMContentLoaded', () => {
  initNav()
  initChatbot()
  initAnimations()
  initHeaderScroll()
  initContadores()
  initTypewriter()
  initInscPopup()
  initCitacao()
})

function initNav() {
  const toggle = document.getElementById('mobileToggle')
  const nav = document.getElementById('nav')
  toggle?.addEventListener('click', () => {
    nav?.classList.toggle('open')
  })
  nav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav?.classList.remove('open'))
  })
  const path = window.location.pathname
  nav?.querySelectorAll('a').forEach(a => {
    const h = a.getAttribute('href')
    if (h && path.endsWith(h)) a.classList.add('active')
  })
}

function initHeaderScroll() {
  const header = document.querySelector('.header')
  if (!header) return
  let ticking = false
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 20)
        ticking = false
      })
      ticking = true
    }
  })
}

function initAnimations() {
  const els = document.querySelectorAll('.anim-fade-in, .anim-up')
  if (!els.length) return
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        obs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  els.forEach(el => obs.observe(el))
}

function initContadores() {
  const contadores = document.querySelectorAll('[data-contar]')
  if (!contadores.length) return
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target
        const target = parseInt(el.dataset.contar, 10)
        const sufixo = el.dataset.sufixo || ''
        const duracao = parseInt(el.dataset.duracao, 10) || 1500
        if (isNaN(target)) return
        animarNumero(el, target, sufixo, duracao)
        obs.unobserve(el)
      }
    })
  }, { threshold: 0.5 })
  contadores.forEach(el => obs.observe(el))
}

function animarNumero(el, target, sufixo, duracao) {
  const start = performance.now()
  function step(now) {
    const progress = Math.min((now - start) / duracao, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(ease * target)
    el.textContent = current + sufixo
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function initInscPopup() {
  const popup = document.getElementById('inscPopup')
  if (!popup) return
  const dismissed = sessionStorage.getItem('inscPopupDismissed')
  if (dismissed) return
  setTimeout(() => popup.classList.add('open'), 1000)
}

function closeInscPopup() {
  const popup = document.getElementById('inscPopup')
  if (!popup) return
  popup.classList.remove('open')
  sessionStorage.setItem('inscPopupDismissed', 'true')
}

function initCitacao() {
  const el = document.getElementById('hero-citacao')
  if (!el) return
  el.innerHTML = '«(...) venero a Matemática (...) Vislumbro-a, vassalo-a, rendo-me por completo. Uma ciência tão bonita, mãe de tantas outras, indispensável para o dia-a-dia e para as maiores descobertas do planeta. Um encanto que pouca gente compreende.»<span class="hero-citacao-author">— Crónicas d\'Adolescente, de Tomás Correia</span>'
}

function initTypewriter() {
  const el = document.querySelector('.hero-typewriter')
  if (!el) return
  const text = el.textContent
  el.textContent = ''
  el.style.opacity = '1'
  let i = 0
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const interval = setInterval(() => {
        if (i < text.length) {
          el.textContent += text.charAt(i)
          i++
        } else {
          clearInterval(interval)
          el.classList.add('done')
        }
      }, 35)
      obs.unobserve(el)
    }
  }, { threshold: 0.5 })
  obs.observe(el)
}
