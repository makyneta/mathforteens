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
  if (!supabase) return;
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

// Check existing session
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
    return `
      <div class="admin-list-item">
        ${thumb ? `<img src="${thumb}" class="admin-list-thumb" alt="${v.title}" onerror="this.style.display='none'">` : ''}
        <div class="admin-list-info">
          <h4>${esc(v.title)}</h4>
          <p>${v.topic ? esc(v.topic) + ' · ' : ''}${esc(v.youtube_url)}</p>
        </div>
        ${v.featured ? '<span class="admin-badge active">Destaque</span>' : ''}
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
const forms = {
  video: {
    title: 'Vídeo YouTube',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'youtube_url', label: 'URL do YouTube', type: 'url', required: true, placeholder: 'https://www.youtube.com/watch?v=...' },
      { name: 'topic', label: 'Tópico', type: 'text', placeholder: 'Ex: Derivadas' },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'pdf_url', label: 'URL do PDF (opcional)', type: 'url', placeholder: 'https://...' },
      { name: 'order', label: 'Ordem', type: 'number', value: 0 },
      { name: 'featured', label: 'Vídeo de destaque', type: 'checkbox' }
    ]
  },
  testimonial: {
    title: 'Testemunho',
    fields: [
      { name: 'author_name', label: 'Nome do autor', type: 'text', required: true },
      { name: 'author_role', label: 'Cargo/Função', type: 'text', placeholder: 'Ex: Aluno do 10.º ano' },
      { name: 'content', label: 'Testemunho', type: 'textarea', required: true },
      { name: 'rating', label: 'Avaliação (1-5)', type: 'number', value: 5, min: 1, max: 5 },
      { name: 'order', label: 'Ordem', type: 'number', value: 0 },
      { name: 'active', label: 'Ativo', type: 'checkbox', defaultChecked: true }
    ]
  },
  product: {
    title: 'Produto da Loja',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, placeholder: 'nome-do-produto' },
      { name: 'category', label: 'Categoria', type: 'select', options: ['livro', 'resumo', 'ficha', 'curso', 'outro'], required: true },
      { name: 'description', label: 'Descrição curta', type: 'text' },
      { name: 'long_description', label: 'Descrição longa', type: 'textarea' },
      { name: 'price', label: 'Preço (€)', type: 'number', required: true, step: '0.01' },
      { name: 'original_price', label: 'Preço original (€, opcional)', type: 'number', step: '0.01' },
      { name: 'image_url', label: 'URL da imagem', type: 'url', placeholder: 'https://...' },
      { name: 'download_url', label: 'URL de download (PDF)', type: 'url' },
      { name: 'external_url', label: 'Link externo (compra)', type: 'url' },
      { name: 'order', label: 'Ordem', type: 'number', value: 0 },
      { name: 'featured', label: 'Produto em destaque', type: 'checkbox' },
      { name: 'active', label: 'Ativo', type: 'checkbox', defaultChecked: true }
    ]
  }
};

async function openModal(type, id) {
  editingType = type;
  editingId = id || null;
  const form = forms[type];
  document.getElementById('modalTitle').textContent = id ? 'Editar ' + form.title : 'Adicionar ' + form.title;

  let data = null;
  if (id) {
    const { data: row } = await db.from(type === 'video' ? 'videos' : type + 's').select('*').eq('id', id).single();
    data = row;
  }

  const formEl = document.getElementById('modalForm');
  formEl.innerHTML = form.fields.map(f => {
    const val = data ? (data[f.name] ?? '') : (f.value ?? (f.defaultChecked ? '' : ''));
    if (f.type === 'checkbox') {
      const checked = data ? !!data[f.name] : !!f.defaultChecked;
      return `<div class="admin-check-row"><input type="checkbox" id="field_${f.name}" name="${f.name}" ${checked ? 'checked' : ''}><label for="field_${f.name}">${f.label}</label></div>`;
    }
    if (f.type === 'select') {
      return `<div class="admin-field"><label for="field_${f.name}">${f.label}</label><select id="field_${f.name}" name="${f.name}" ${f.required ? 'required' : ''}>${f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="admin-field"><label for="field_${f.name}">${f.label}</label><textarea id="field_${f.name}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}">${esc(val)}</textarea></div>`;
    }
    return `<div class="admin-field"><label for="field_${f.name}">${f.label}</label><input type="${f.type}" id="field_${f.name}" name="${f.name}" value="${esc(val)}" ${f.required ? 'required' : ''} ${f.placeholder ? 'placeholder="' + f.placeholder + '"' : ''} ${f.step ? 'step="' + f.step + '"' : ''} ${f.min !== undefined ? 'min="' + f.min + '"' : ''} ${f.max !== undefined ? 'max="' + f.max + '"' : ''}></div>`;
  }).join('');

  formEl.innerHTML += `<div class="admin-modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button></div>`;

  formEl.onsubmit = (e) => { e.preventDefault(); saveItem(); };
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingId = null;
  editingType = null;
}

// ============================================
// SAVE / DELETE
// ============================================
async function saveItem() {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const formEl = document.getElementById('modalForm');
  const formData = new FormData(formEl);
  const obj = {};

  // Get all fields from the form definition
  const fieldDefs = forms[editingType].fields;
  fieldDefs.forEach(f => {
    if (f.type === 'checkbox') {
      obj[f.name] = document.getElementById('field_' + f.name).checked;
    } else if (f.type === 'number') {
      const val = formData.get(f.name);
      obj[f.name] = val === '' || val === null ? null : parseFloat(val);
    } else {
      obj[f.name] = formData.get(f.name) || '';
    }
  });

  // Auto-generate slug for products
  if (editingType === 'product' && obj.name && !editingId) {
    obj.slug = obj.slug || obj.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
