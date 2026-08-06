(function () {
  'use strict'

  const form = document.getElementById('formInscricao')
  if (!form) return

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const TEL_RE = /^[239][0-9]{8}$/
  const MSG_REQUIRED = 'Este campo é obrigatório.'
  const MSG_EMAIL = 'Introduz um email válido (ex: nome@email.com).'
  const MSG_TEL = 'Introduz um número válido com 9 dígitos (ex: 912 345 678).'
  const MSG_NOME = 'Preenche este campo com pelo menos 3 caracteres.'

  const validators = {
    email: v => (EMAIL_RE.test(v.trim()) ? '' : MSG_EMAIL),
    tel: v => (TEL_RE.test(v.replace(/\D/g, '')) ? '' : MSG_TEL),
    text: v => (v.trim().length >= 3 ? '' : MSG_NOME),
    'optional-text': () => '',
  }

  const steps = [...document.querySelectorAll('.insc-progress-step')]
  const cards = [...document.querySelectorAll('.insc-card[data-card]')]
  const btn = document.getElementById('btnInsc')
  const successPanel = document.getElementById('inscSuccess')
  const errorPanel = document.getElementById('inscError')
  const charCount = document.getElementById('notasCount')
  const notas = document.getElementById('notas')
  const consentGroup = document.querySelector('.insc-consent[data-group]')

  function fieldErrorEl(input) {
    const group = input.closest('.insc-form-group[data-group]')
    if (!group) return null
    let el = group.querySelector('.field-error')
    if (!el) {
      el = document.createElement('p')
      el.className = 'field-error'
      el.setAttribute('aria-live', 'polite')
      group.appendChild(el)
    }
    return el
  }

  function setError(input, msg) {
    const group = input.closest('.insc-form-group[data-group]')
    const el = fieldErrorEl(input)
    if (!el) return
    el.textContent = msg
    el.classList.add('visible')
    input.classList.add('input-error')
    input.setAttribute('aria-invalid', 'true')
    if (group) group.classList.add('has-error')
  }

  function clearError(input) {
    const group = input.closest('.insc-form-group[data-group]')
    const el = fieldErrorEl(input)
    if (!el) return
    el.textContent = ''
    el.classList.remove('visible')
    input.classList.remove('input-error')
    input.removeAttribute('aria-invalid')
    if (group) group.classList.remove('has-error')
  }

  function setGroupError(group, msg) {
    const el = group.querySelector(':scope > .field-error')
    if (!el) return
    el.textContent = msg
    el.classList.add('visible')
    group.classList.add('has-error')
  }

  function clearGroupError(group) {
    const el = group.querySelector(':scope > .field-error')
    if (!el) return
    el.textContent = ''
    el.classList.remove('visible')
    group.classList.remove('has-error')
  }

  function isHiddenConditional(input) {
    const cond = input.closest('.insc-conditional')
    return cond && cond.hidden
  }

  function checkInput(input, showErrors) {
    const value = input.value
    const validator = validators[input.dataset.validate]
    if (!validator) return true
    const msg = validator(value)
    if (msg) {
      if (showErrors) setError(input, msg)
      return false
    }
    if (showErrors) clearError(input)
    return true
  }

  function checkGroup(group, showErrors) {
    let ok = true

    group.querySelectorAll('input[data-validate], textarea[data-validate]').forEach(input => {
      if (isHiddenConditional(input)) return
      if (input.dataset.validate === 'optional-text' && !input.value.trim()) {
        if (showErrors) clearError(input)
        return
      }
      if (!checkInput(input, showErrors)) ok = false
    })

    const radioName = group.dataset.radio
    if (radioName) {
      const inputs = group.querySelectorAll('input[name="' + radioName + '"]')
      const valid = [...inputs].some(i => i.checked)
      if (!valid) {
        if (showErrors) setGroupError(group, 'Seleciona uma das opções.')
        ok = false
      } else if (showErrors) {
        clearGroupError(group)
      }
    }

    const checkboxName = group.dataset.checkbox
    if (checkboxName) {
      const inputs = group.querySelectorAll('input[name="' + checkboxName + '"]')
      const valid = [...inputs].some(i => i.checked)
      if (!valid) {
        if (showErrors) setGroupError(group, 'Seleciona pelo menos uma opção.')
        ok = false
      } else if (showErrors) {
        clearGroupError(group)
      }
    }

    return ok
  }

  function isCardComplete(card) {
    const groups = [...card.querySelectorAll('.insc-form-group[data-group]')]
    return groups.length > 0 && groups.every(g => checkGroup(g, false))
  }

  function updateProgress() {
    cards.forEach((card, i) => {
      const done = isCardComplete(card)
      const isLast = i === cards.length - 1
      const allBeforeDone = cards.slice(0, i).every(c => isCardComplete(c))
      if (steps[i]) steps[i].classList.toggle('done', isLast ? done && allBeforeDone : done)
    })
  }

  function setConsentError(show) {
    if (!consentGroup) return
    const el = consentGroup.querySelector(':scope > .field-error')
    if (!el) return
    if (show) {
      el.textContent = 'Precisamos do teu consentimento para processar a inscrição.'
      el.classList.add('visible')
      consentGroup.classList.add('has-error')
    } else {
      el.textContent = ''
      el.classList.remove('visible')
      consentGroup.classList.remove('has-error')
    }
  }

  function validateAll(showErrors) {
    let ok = true
    cards.forEach(card => {
      card.querySelectorAll('.insc-form-group[data-group]').forEach(g => {
        if (!checkGroup(g, showErrors)) ok = false
      })
    })
    const consent = consentGroup ? consentGroup.querySelector('#consentimento') : null
    if (consent && !consent.checked) {
      if (showErrors) setConsentError(true)
      ok = false
    } else if (showErrors) {
      setConsentError(false)
    }
    return ok
  }

  function scrollToFirstError() {
    const el = document.querySelector('.field-error.visible, .insc-consent.has-error')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    let focusable = null
    const group = el.closest('.insc-form-group[data-group]')
    if (group) focusable = group.querySelector('input[data-validate], textarea[data-validate]')
    if (!focusable && consentGroup) focusable = consentGroup.querySelector('#consentimento')
    if (focusable) focusable.focus({ preventScroll: true })
  }

  function toggleConditional() {
    const outra = document.getElementById('outraDisciplina')
    const outraInput = document.getElementById('outra_disciplina')
    const outraChecked = [...document.querySelectorAll('input[name="disciplinas"]')].some(
      i => i.value === 'outra_superior' && i.checked
    )
    if (outra) outra.hidden = !outraChecked
    if (outraInput && outraChecked) {
      outraInput.required = true
    } else if (outraInput) {
      outraInput.required = false
      clearError(outraInput)
    }

    const anoCond = document.getElementById('anoFrequentado')
    const freq = [...document.querySelectorAll('input[name="frequentou"]')].some(i => i.checked && i.value === 'Sim')
    if (anoCond) anoCond.hidden = !freq
  }

  function formatPhone(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 9)
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
    input.value = parts.join(' ')
  }

  function initCharCount() {
    if (!notas || !charCount) return
    const update = () => {
      const left = 500 - notas.value.length
      charCount.textContent = left <= 0 ? 'Limite atingido.' : left + ' caracteres restantes'
      charCount.classList.toggle('near', left <= 50)
    }
    notas.addEventListener('input', update)
    update()
  }

  function showToast(msg, type) {
    let container = document.querySelector('.toast-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'toast-container'
      document.body.appendChild(container)
    }
    const toast = document.createElement('div')
    toast.className = 'toast ' + (type === 'success' ? 'toast-success' : 'toast-error')
    toast.setAttribute('role', 'status')
    toast.textContent = msg
    container.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('out')
      setTimeout(() => toast.remove(), 250)
    }, 4000)
  }

  function setLoading(loading) {
    if (!btn) return
    btn.classList.toggle('loading', loading)
    btn.disabled = loading
    btn.setAttribute('aria-busy', String(loading))
  }

  function hidePanels() {
    if (successPanel) successPanel.hidden = true
    if (errorPanel) errorPanel.hidden = true
  }

  function showSuccess() {
    hidePanels()
    form.hidden = true
    if (successPanel) {
      successPanel.hidden = false
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    showToast('Inscrição enviada com sucesso! 🎉', 'success')
  }

  function showError() {
    hidePanels()
    if (errorPanel) {
      errorPanel.hidden = false
      errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    showToast('Não foi possível enviar a inscrição. Tenta novamente.', 'error')
  }

  function isBot() {
    const hp = document.getElementById('website')
    return hp && hp.value.trim().length > 0
  }

  form.addEventListener('input', (e) => {
    if (e.target.id === 'consentimento' && e.target.checked) setConsentError(false)
    if (e.target.matches('[data-validate]')) checkGroup(e.target.closest('.insc-form-group[data-group]'), true)
    if (e.target.matches('[data-tel]')) formatPhone(e.target)
    if (e.target.matches('input[name="disciplinas"], input[name="frequentou"]')) toggleConditional()
    updateProgress()
  })

  form.addEventListener('change', () => {
    toggleConditional()
    updateProgress()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hidePanels()
    if (isBot()) {
      showSuccess()
      return
    }
    if (!validateAll(true)) {
      scrollToFirstError()
      showToast('Verifica os campos assinalados.', 'error')
      updateProgress()
      return
    }
    setLoading(true)
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error('Formspree request failed')
      showSuccess()
    } catch (err) {
      setLoading(false)
      showError()
    }
  })

  toggleConditional()
  updateProgress()
  initCharCount()
})()
