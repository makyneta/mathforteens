// ============================================
// Math For Teens — Admin Panel
// ============================================

let db;
try {
  if (!window.supabase) throw new Error('Supabase library not loaded');
  if (!window.supabase.createClient) throw new Error('createClient not found');
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.error('Supabase init error:', e);
  document.getElementById('loginError').textContent = 'Erro ao ligar ao servidor: ' + e.message;
  document.getElementById('loginError').style.display = 'block';
}

let currentUser = null;
let editingId = null;
let editingType = null;

// ============================================
// AUTH
// ============================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!db) return;
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;
  errorEl.style.display = 'none';

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
    btn.innerHTML = 'Entrar';
    btn.disabled = false;
    return;
  }

  currentUser = data.user;
  showAdmin();
});

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
});

db.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    showAdmin();
  }
});

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  document.getElementById('adminEmail').textContent = currentUser.email;
  loadAll();
}

// ============================================
// NAVIGATION
// ============================================
document.querySelectorAll('.admin-nav-link[data-tab]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    document.querySelectorAll('.admin-nav-link[data-tab]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('pageTitle').textContent = link.textContent.trim();
  });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.querySelector('.admin-sidebar').classList.toggle('open');
});

// ============================================
// LOAD DATA
// ============================================
async function loadAll() {
  await Promise.all([loadVideos(), loadTestimonials(), loadProducts()]);
}

async function loadVideos() {
  const { data, error } = await db.from('videos').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar vídeos', 'error'); return; }
  renderVideos(data || []);
}

async function loadTestimonials() {
  const { data, error } = await db.from('testimonials').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar testemunhos', 'error'); return; }
  renderTestimonials(data || []);
}

async function loadProducts() {
  const { data, error } = await db.from('products').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar produtos', 'error'); return; }
  renderProducts(data || []);
}

// ============================================
// UPLOAD PDF TO SUPABASE STORAGE
// ============================================
async function uploadPdf(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const filename = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '.' + ext;
  const path = 'videos/' + filename;

  const { error } = await db.storage.from('pdfs').upload(path, file);
  if (error) throw error;

  const { data } = db.storage.from('pdfs').getPublicUrl(path);
  return data.publicUrl;
}

async function deletePdf(url) {
  if (!url) return;
  const path = url.split('/pdfs/')[1];
  if (path) await db.storage.from('pdfs').remove([path]);
}

// ============================================
// RENDER LISTS
// ============================================
function renderVideos(items) {
  const list = document.getElementById('videosList');
  const empty = document.getElementById('videosEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; return; }
  empty.style.display = 'none'; list.style.display = 'flex';
  list.innerHTML = items.map(v => {
    const id = extractVideoId(v.youtube_url);
    const thumb = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
    const badges = [];
    if (v.featured) badges.push('<span class="admin-badge active">Destaque</span>');
    if (v.draft) badges.push('<span class="admin-badge inactive">Rascunho</span>');
    return `
      <div class="admin-list-item">
        ${thumb ? `<img src="${thumb}" class="admin-list-thumb" alt="${v.title}" onerror="this.style.display='none'">` : ''}
        <div class="admin-list-info">
          <h4>${esc(v.title)}</h4>
          <p>${v.topic ? esc(v.topic) + ' · ' : ''}${v.pdf_url ? '📎 PDF anexado' : 'Sem PDF'}</p>
        </div>
        ${badges.join(' ')}
        <div class="admin-list-actions">
          <button class="admin-action-btn" onclick="openModal('video','${v.id}')">Editar</button>
          <button class="admin-action-btn danger" onclick="deleteItem('videos','${v.id}')">Apagar</button>
        </div>
      </div>`;
  }).join('');
}

function renderTestimonials(items) {
  const list = document.getElementById('testimonialsList');
  const empty = document.getElementById('testimonialsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; return; }
  empty.style.display = 'none'; list.style.display = 'flex';
  list.innerHTML = items.map(t => `
    <div class="admin-list-item">
      <div class="admin-list-info">
        <h4>${esc(t.author_name)} ${t.author_role ? '<span style="font-weight:400;color:var(--c-text-secondary);font-size:0.8rem">— ' + esc(t.author_role) + '</span>' : ''}</h4>
        <p>"${esc(t.content.substring(0, 80))}${t.content.length > 80 ? '...' : ''}"</p>
      </div>
      <span class="admin-badge ${t.active ? 'active' : 'inactive'}">${t.active ? 'Ativo' : 'Inativo'}</span>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('testimonial','${t.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('testimonials','${t.id}')">Apagar</button>
      </div>
    </div>`).join('');
}

function renderProducts(items) {
  const list = document.getElementById('productsList');
  const empty = document.getElementById('productsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; return; }
  empty.style.display = 'none'; list.style.display = 'flex';
  list.innerHTML = items.map(p => `
    <div class="admin-list-item">
      ${p.image_url ? `<img src="${esc(p.image_url)}" class="admin-list-thumb" alt="${p.name}" onerror="this.style.display='none'">` : ''}
      <div class="admin-list-info">
        <h4>${esc(p.name)}</h4>
        <p>${esc(p.category)} · ${p.price}€${p.original_price ? ' <s style="color:var(--c-text-tertiary)">' + p.original_price + '€</s>' : ''}</p>
      </div>
      <span class="admin-badge ${p.active ? 'active' : 'inactive'}">${p.active ? 'Ativo' : 'Inativo'}</span>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('product','${p.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('products','${p.id}')">Apagar</button>
      </div>
    </div>`).join('');
}

// ============================================
// MODAL / FORMS
// ============================================
function getVideoFormHtml(data) {
  const v = data || {};
  const hasPdf = v.pdf_url && v.pdf_url.trim();
  return `
    <div class="admin-field"><label>Título *</label><input type="text" id="field_title" value="${esc(v.title || '')}" required></div>
    <div class="admin-field"><label>URL do YouTube *</label><input type="url" id="field_youtube_url" value="${esc(v.youtube_url || '')}" required placeholder="https://www.youtube.com/watch?v=..."></div>
    <div class="admin-field"><label>Tópico</label><input type="text" id="field_topic" value="${esc(v.topic || '')}" placeholder="Ex: Derivadas"></div>
    <div class="admin-field"><label>Descrição</label><textarea id="field_description" placeholder="Descrição da aula...">${esc(v.description || '')}</textarea></div>
    <div class="admin-field">
      <label>PDF da aula</label>
      <div class="admin-pdf-upload">
        <input type="file" id="field_pdf_file" accept=".pdf" style="display:none" onchange="handlePdfPreview(this)">
        <button type="button" class="btn btn-secondary admin-btn-full" onclick="document.getElementById('field_pdf_file').click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          ${hasPdf ? 'Substituir PDF' : 'Carregar PDF'}
        </button>
        <div id="pdfPreview" class="admin-pdf-preview">
          ${hasPdf ? `<div class="admin-pdf-file"><a href="${esc(v.pdf_url)}" target="_blank">📄 PDF atual</a><button type="button" class="admin-action-btn danger" onclick="removePdf()">Remover</button></div>` : ''}
        </div>
      </div>
    </div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Ordem</label><input type="number" id="field_order" value="${v.order || 0}"></div>
      <div style="display:flex;flex-direction:column;gap:12px;padding-top:24px">
        <div class="admin-check-row"><input type="checkbox" id="field_featured" ${v.featured ? 'checked' : ''}><label for="field_featured">Destaque</label></div>
        <div class="admin-check-row"><input type="checkbox" id="field_draft" ${v.draft ? 'checked' : ''}><label for="field_draft">Rascunho (não publicar)</label></div>
      </div>
    </div>`;
}

function getTestimonialFormHtml(data) {
  const t = data || {};
  return `
    <div class="admin-field"><label>Nome do autor *</label><input type="text" id="field_author_name" value="${esc(t.author_name || '')}" required></div>
    <div class="admin-field"><label>Cargo/Função</label><input type="text" id="field_author_role" value="${esc(t.author_role || '')}" placeholder="Ex: Aluno do 10.º ano"></div>
    <div class="admin-field"><label>Testemunho *</label><textarea id="field_content" required placeholder="Escreve o testemunho...">${esc(t.content || '')}</textarea></div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Avaliação (1-5)</label><input type="number" id="field_rating" value="${t.rating || 5}" min="1" max="5"></div>
      <div class="admin-field"><label>Ordem</label><input type="number" id="field_order" value="${t.order || 0}"></div>
    </div>
    <div class="admin-check-row"><input type="checkbox" id="field_active" ${t.active !== false ? 'checked' : ''}><label for="field_active">Ativo</label></div>`;
}

function getProductFormHtml(data) {
  const p = data || {};
  return `
    <div class="admin-field"><label>Nome *</label><input type="text" id="field_name" value="${esc(p.name || '')}" required></div>
    <div class="admin-field"><label>Slug (URL) *</label><input type="text" id="field_slug" value="${esc(p.slug || '')}" required placeholder="nome-do-produto"></div>
    <div class="admin-field"><label>Categoria *</label><select id="field_category" required>
      ${['livro','resumo','ficha','curso','outro'].map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select></div>
    <div class="admin-field"><label>Descrição curta</label><input type="text" id="field_description" value="${esc(p.description || '')}"></div>
    <div class="admin-field"><label>Descrição longa</label><textarea id="field_long_description">${esc(p.long_description || '')}</textarea></div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Preço (€) *</label><input type="number" id="field_price" value="${p.price || ''}" step="0.01" required></div>
      <div class="admin-field"><label>Preço original (€)</label><input type="number" id="field_original_price" value="${p.original_price || ''}" step="0.01"></div>
    </div>
    <div class="admin-field"><label>URL da imagem</label><input type="url" id="field_image_url" value="${esc(p.image_url || '')}" placeholder="https://..."></div>
    <div class="admin-field"><label>Link externo (compra)</label><input type="url" id="field_external_url" value="${esc(p.external_url || '')}"></div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Ordem</label><input type="number" id="field_order" value="${p.order || 0}"></div>
      <div style="display:flex;flex-direction:column;gap:12px;padding-top:24px">
        <div class="admin-check-row"><input type="checkbox" id="field_featured" ${p.featured ? 'checked' : ''}><label for="field_featured">Destaque</label></div>
        <div class="admin-check-row"><input type="checkbox" id="field_active" ${p.active !== false ? 'checked' : ''}><label for="field_active">Ativo</label></div>
      </div>
    </div>`;
}

let pendingPdfFile = null;
let removePdfFlag = false;

function handlePdfPreview(input) {
  const file = input.files[0];
  if (!file) return;
  pendingPdfFile = file;
  removePdfFlag = false;
  document.getElementById('pdfPreview').innerHTML = `<div class="admin-pdf-file"><span>📄 ${esc(file.name)} (${(file.size / 1024).toFixed(0)} KB)</span><button type="button" class="admin-action-btn danger" onclick="removePdf()">Remover</button></div>`;
}

function removePdf() {
  pendingPdfFile = null;
  removePdfFlag = true;
  document.getElementById('pdfPreview').innerHTML = '';
  document.getElementById('field_pdf_file').value = '';
}

async function openModal(type, id) {
  editingType = type;
  editingId = id || null;
  pendingPdfFile = null;
  removePdfFlag = false;

  let data = null;
  if (id) {
    const table = type === 'video' ? 'videos' : type + 's';
    const { data: row } = await db.from(table).select('*').eq('id', id).single();
    data = row;
  }

  const titles = { video: 'Vídeo YouTube', testimonial: 'Testemunho', product: 'Produto da Loja' };
  document.getElementById('modalTitle').textContent = id ? 'Editar ' + titles[type] : 'Adicionar ' + titles[type];

  const formEl = document.getElementById('modalForm');
  if (type === 'video') formEl.innerHTML = getVideoFormHtml(data);
  else if (type === 'testimonial') formEl.innerHTML = getTestimonialFormHtml(data);
  else if (type === 'product') formEl.innerHTML = getProductFormHtml(data);

  formEl.innerHTML += `<div class="admin-modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button></div>`;
  formEl.onsubmit = (e) => { e.preventDefault(); saveItem(); };
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingId = null;
  editingType = null;
  pendingPdfFile = null;
  removePdfFlag = false;
}

// ============================================
// SAVE / DELETE
// ============================================
async function saveItem() {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const obj = {};

  if (editingType === 'video') {
    obj.title = document.getElementById('field_title').value;
    obj.youtube_url = document.getElementById('field_youtube_url').value;
    obj.topic = document.getElementById('field_topic').value;
    obj.description = document.getElementById('field_description').value;
    obj.order = parseInt(document.getElementById('field_order').value) || 0;
    obj.featured = document.getElementById('field_featured').checked;
    obj.draft = document.getElementById('field_draft').checked;

    // Handle PDF
    if (removePdfFlag && !pendingPdfFile) {
      if (editingId && obj.pdf_url !== undefined) {
        const old = await db.from('videos').select('pdf_url').eq('id', editingId).single();
        if (old.data?.pdf_url) await deletePdf(old.data.pdf_url);
      }
      obj.pdf_url = null;
    } else if (pendingPdfFile) {
      try {
        if (editingId) {
          const old = await db.from('videos').select('pdf_url').eq('id', editingId).single();
          if (old.data?.pdf_url) await deletePdf(old.data.pdf_url);
        }
        obj.pdf_url = await uploadPdf(pendingPdfFile);
      } catch(e) {
        showToast('Erro ao upload PDF: ' + e.message, 'error');
        btn.innerHTML = 'Guardar';
        btn.disabled = false;
        return;
      }
    }
  } else if (editingType === 'testimonial') {
    obj.author_name = document.getElementById('field_author_name').value;
    obj.author_role = document.getElementById('field_author_role').value;
    obj.content = document.getElementById('field_content').value;
    obj.rating = parseInt(document.getElementById('field_rating').value) || 5;
    obj.order = parseInt(document.getElementById('field_order').value) || 0;
    obj.active = document.getElementById('field_active').checked;
  } else if (editingType === 'product') {
    obj.name = document.getElementById('field_name').value;
    obj.slug = document.getElementById('field_slug').value;
    obj.category = document.getElementById('field_category').value;
    obj.description = document.getElementById('field_description').value;
    obj.long_description = document.getElementById('field_long_description').value;
    obj.price = parseFloat(document.getElementById('field_price').value) || 0;
    const opVal = document.getElementById('field_original_price').value;
    obj.original_price = opVal ? parseFloat(opVal) : null;
    obj.image_url = document.getElementById('field_image_url').value;
    obj.external_url = document.getElementById('field_external_url').value;
    obj.order = parseInt(document.getElementById('field_order').value) || 0;
    obj.featured = document.getElementById('field_featured').checked;
    obj.active = document.getElementById('field_active').checked;
  }

  const table = editingType === 'video' ? 'videos' : editingType + 's';
  let result;
  if (editingId) {
    result = await db.from(table).update(obj).eq('id', editingId);
  } else {
    result = await db.from(table).insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editingId ? 'Atualizado com sucesso!' : 'Criado com sucesso!', 'success');
  closeModal();
  loadAll();
}

async function deleteItem(table, id) {
  if (!confirm('Tem certeza que queres apagar este item?')) return;

  if (table === 'videos') {
    const { data } = await db.from('videos').select('pdf_url').eq('id', id).single();
    if (data?.pdf_url) await deletePdf(data.pdf_url);
  }

  const { error } = await db.from(table).delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('Apagado com sucesso!', 'success');
  loadAll();
}

// ============================================
// UTILS
// ============================================
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'admin-toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
