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
let allFolders = [];

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
  await Promise.all([loadVideos(), loadFolders(), loadTestimonials(), loadProducts(), loadLogins()]);
}

async function loadVideos() {
  const { data, error } = await db.from('videos').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar vídeos', 'error'); return; }
  window._adminVideos = data || [];
  renderVideos(window._adminVideos);
  renderAdminFolders();
}

async function loadFolders() {
  const { data, error } = await db.from('folders').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar pastas', 'error'); return; }
  allFolders = data || [];
  renderAdminFolders();
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

async function loadLogins() {
  const { data, error } = await db.from('platform_logins').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar logins', 'error'); return; }
  renderLogins(data || []);
}

// ============================================
// UPLOAD PDF TO GITHUB
// ============================================
let githubToken = null;

async function getGithubToken() {
  if (githubToken) return githubToken;
  const { data } = await db.from('site_config').select('value').eq('key', 'github_token').single();
  githubToken = data?.value || null;
  return githubToken;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPdf(file) {
  const token = await getGithubToken();
  if (!token) throw new Error('Token GitHub não configurado. Vai a Supabase > site_config e adiciona github_token.');

  if (!file) return null;
  const ext = file.name.split('.').pop();
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  const filename = cleanName + '-' + Date.now().toString(36) + '.' + ext;
  const path = GITHUB_PDF_PATH + '/' + filename;

  const content = await fileToBase64(file);

  const res = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'Upload PDF: ' + file.name, content })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao enviar para GitHub');
  }

  return GITHUB_PDF_BASE_URL + '/' + filename;
}

async function deletePdf(url) {
  if (!url || !url.includes(GITHUB_PDF_PATH)) return;
  const token = await getGithubToken();
  if (!token) return;

  const filename = url.split('/').pop();
  const path = GITHUB_PDF_PATH + '/' + filename;

  const getRes = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path, {
    headers: { 'Authorization': 'token ' + token }
  });
  if (!getRes.ok) return;
  const fileData = await getRes.json();

  await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path, {
    method: 'DELETE',
    headers: {
      'Authorization': 'token ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'Delete PDF: ' + filename, sha: fileData.sha })
  });
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
    const folder = v.folder_id ? allFolders.find(f => f.id === v.folder_id) : null;
    const badges = [];
    if (v.featured) badges.push('<span class="admin-badge active">Destaque</span>');
    if (v.draft) badges.push('<span class="admin-badge inactive">Rascunho</span>');
    return `
      <div class="admin-list-item">
        ${thumb ? `<img src="${thumb}" class="admin-list-thumb" alt="${v.title}" onerror="this.style.display='none'">` : ''}
        <div class="admin-list-info">
          <h4>${esc(v.title)}</h4>
          <p>${esc(v.subject || 'Matemática')} · ${esc(v.grade || '')}${folder ? ' · 📁 ' + esc(folder.name) : ''}${v.topic ? ' · ' + esc(v.topic) : ''}${v.pdf_url ? ' · PDF' : ''}</p>
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

function renderLogins(items) {
  const list = document.getElementById('loginsList');
  const empty = document.getElementById('loginsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; return; }
  empty.style.display = 'none'; list.style.display = 'flex';
  list.innerHTML = items.map(l => `
    <div class="admin-list-item">
      <div class="admin-list-info">
        <h4>${esc(l.platform_name)}</h4>
        <p>${esc(l.email)}${l.url ? ' · <a href="' + esc(l.url) + '" target="_blank" style="color:var(--c-primary)">' + esc(l.url) + '</a>' : ''}</p>
      </div>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('platform_login','${l.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('platform_logins','${l.id}')">Apagar</button>
      </div>
    </div>`).join('');
}

// ============================================
// FOLDER NAVIGATION (Admin)
// ============================================
let adminNav = { level: 'subjects' };

function getAdminSubjectColors() {
  return {
    'Matemática': '#C8960C',
    'Matemática A': '#D4628A',
    'Matemática B': '#3D2B1F'
  };
}

function renderAdminFolders() {
  if (adminNav.level === 'subjects') renderAdminSubjects();
  else if (adminNav.level === 'grades') renderAdminGrades(adminNav.subject);
  else if (adminNav.level === 'folders') renderAdminFolderList(adminNav.subject, adminNav.grade);
}

function renderAdminSubjects() {
  adminNav = { level: 'subjects' };
  const subjects = ['Matemática', 'Matemática A', 'Matemática B'];
  const colors = getAdminSubjectColors();
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  document.getElementById('foldersBreadcrumb').style.display = 'none';
  document.getElementById('foldersViewTitle').textContent = 'Pastas de Videoaulas';
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Pasta';

  let html = '';
  subjects.forEach(s => {
    const folderCount = allFolders.filter(f => f.subject === s).length;
    const videoCount = (window._adminVideos || []).filter(v => v.subject === s).length;
    html += '<button class="admin-folder-item" onclick="adminNavTo(\'' + s + '\')">'
      + '<div class="admin-folder-icon" style="background:' + colors[s] + '15;color:' + colors[s] + '">'
      + '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
      + '</div>'
      + '<div class="admin-folder-info"><h4>' + esc(s) + '</h4>'
      + '<p>' + folderCount + ' pasta' + (folderCount !== 1 ? 's' : '') + ' · ' + videoCount + ' vídeo' + (videoCount !== 1 ? 's' : '') + '</p></div>'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.3"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</button>';
  });
  grid.innerHTML = html;
  grid.style.display = 'flex';
  empty.style.display = 'none';
}

function renderAdminGrades(subject) {
  adminNav = { level: 'grades', subject: subject };
  const gradesBySubject = {
    'Matemática': ['7.º Ano', '8.º Ano', '9.º Ano'],
    'Matemática A': ['10.º Ano', '11.º Ano', '12.º Ano'],
    'Matemática B': ['10.º Ano', '11.º Ano']
  };
  const grades = gradesBySubject[subject] || [];
  const color = getAdminSubjectColors()[subject] || '#C8960C';
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  const bc = document.getElementById('foldersBreadcrumb');
  document.getElementById('foldersViewTitle').textContent = subject;
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Pasta';

  bc.innerHTML = '<a href="#" onclick="renderAdminSubjects();return false">Pastas</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<strong>' + esc(subject) + '</strong>';
  bc.style.display = 'block';

  let html = '';
  grades.forEach(g => {
    const num = g.replace('.º Ano', '');
    const folderCount = allFolders.filter(f => f.subject === subject && f.grade === g).length;
    const videoCount = (window._adminVideos || []).filter(v => v.subject === subject && v.grade === g).length;
    html += '<button class="admin-folder-item" onclick="adminNavTo(\'' + esc(subject) + '\',\'' + esc(g) + '\')">'
      + '<div class="admin-folder-grade" style="border-color:' + color + '">' + num + '</div>'
      + '<div class="admin-folder-info"><h4>' + esc(g) + '</h4>'
      + '<p>' + folderCount + ' pasta' + (folderCount !== 1 ? 's' : '') + ' · ' + videoCount + ' vídeo' + (videoCount !== 1 ? 's' : '') + '</p></div>'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.3"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</button>';
  });
  grid.innerHTML = html;
  grid.style.display = 'flex';
  empty.style.display = 'none';
}

function renderAdminFolderList(subject, grade) {
  adminNav = { level: 'folders', subject: subject, grade: grade };
  const folders = allFolders.filter(f => f.subject === subject && f.grade === grade);
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  const bc = document.getElementById('foldersBreadcrumb');
  document.getElementById('foldersViewTitle').textContent = subject + ' › ' + grade;
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Pasta';

  bc.innerHTML = '<a href="#" onclick="renderAdminSubjects();return false">Pastas</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<a href="#" onclick="adminNavTo(\'' + esc(subject) + '\');return false">' + esc(subject) + '</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<strong>' + esc(grade) + '</strong>';
  bc.style.display = 'block';

  if (!folders.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'flex';
  grid.innerHTML = folders.map(f => {
    const videoCount = (window._adminVideos || []).filter(v => v.folder_id === f.id).length;
    return '<div class="admin-folder-item">'
      + '<div class="admin-folder-icon" style="background:var(--c-primary-light);color:var(--c-primary)">'
      + '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
      + '</div>'
      + '<div class="admin-folder-info"><h4>' + esc(f.name) + '</h4>'
      + '<p>' + videoCount + ' vídeo' + (videoCount !== 1 ? 's' : '') + (f.order ? ' · Ordem: ' + f.order : '') + '</p></div>'
      + '<div class="admin-list-actions">'
      + '<button class="admin-action-btn" onclick="openFolderModal(\'' + f.id + '\')">Editar</button>'
      + '<button class="admin-action-btn danger" onclick="deleteFolder(\'' + f.id + '\')">Apagar</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

function adminNavTo(subject, grade) {
  if (grade) renderAdminFolderList(subject, grade);
  else renderAdminGrades(subject);
}

// ============================================
// FOLDER CRUD
// ============================================
async function openFolderModal(id) {
  let data = null;
  if (id) {
    const { data: row } = await db.from('folders').select('*').eq('id', id).single();
    data = row;
  }

  const f = data || {};
  const subjects = ['Matemática', 'Matemática A', 'Matemática B'];
  const gradesBySubject = {
    'Matemática': ['7.º Ano', '8.º Ano', '9.º Ano'],
    'Matemática A': ['10.º Ano', '11.º Ano', '12.º Ano'],
    'Matemática B': ['10.º Ano', '11.º Ano']
  };

  let currentSubject = f.subject || adminNav.subject || 'Matemática';
  let currentGrade = f.grade || adminNav.grade || '7.º Ano';

  document.getElementById('modalTitle').textContent = id ? 'Editar Pasta' : 'Adicionar Pasta';
  const formEl = document.getElementById('modalForm');
  formEl.innerHTML = `
    <div class="admin-field-row">
      <div class="admin-field"><label>Disciplina *</label><select id="field_folder_subject" required onchange="updateFolderGradeOptions()">
        ${subjects.map(s => `<option value="${s}" ${currentSubject === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></div>
      <div class="admin-field"><label>Ano Escolar *</label><select id="field_folder_grade" required>
        ${(gradesBySubject[currentSubject] || []).map(g => `<option value="${g}" ${currentGrade === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select></div>
    </div>
    <div class="admin-field"><label>Nome da Pasta *</label><input type="text" id="field_folder_name" value="${esc(f.name || '')}" required placeholder="Ex: Derivadas"></div>
    <div class="admin-field"><label>Ordem</label><input type="number" id="field_folder_order" value="${f.order || 0}"></div>
    <div class="admin-modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  formEl.onsubmit = (e) => { e.preventDefault(); saveFolder(id); };
  document.getElementById('modal').style.display = 'flex';
}

function updateFolderGradeOptions() {
  const gradesBySubject = {
    'Matemática': ['7.º Ano', '8.º Ano', '9.º Ano'],
    'Matemática A': ['10.º Ano', '11.º Ano', '12.º Ano'],
    'Matemática B': ['10.º Ano', '11.º Ano']
  };
  const subject = document.getElementById('field_folder_subject').value;
  const gradeSelect = document.getElementById('field_folder_grade');
  const grades = gradesBySubject[subject] || [];
  gradeSelect.innerHTML = grades.map(g => `<option value="${g}">${g}</option>`).join('');
}

async function saveFolder(editId) {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const obj = {
    name: document.getElementById('field_folder_name').value,
    subject: document.getElementById('field_folder_subject').value,
    grade: document.getElementById('field_folder_grade').value,
    order: parseInt(document.getElementById('field_folder_order').value) || 0
  };

  let result;
  if (editId) {
    result = await db.from('folders').update(obj).eq('id', editId);
  } else {
    result = await db.from('folders').insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editId ? 'Pasta atualizada!' : 'Pasta criada!', 'success');
  closeModal();
  loadFolders();
  loadVideos();
}

async function deleteFolder(id) {
  if (!confirm('Tem certeza que queres apagar esta pasta?\nOs vídeos dentro dela ficarão sem pasta.')) return;
  const { error } = await db.from('folders').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('Pasta apagada!', 'success');
  loadFolders();
  loadVideos();
}

// ============================================
// MODAL / FORMS
// ============================================
function getVideoFormHtml(data) {
  const v = data || {};
  const hasPdf = v.pdf_url && v.pdf_url.trim();
  const subjects = ['Matemática', 'Matemática A', 'Matemática B'];
  const gradesBySubject = {
    'Matemática': ['7.º Ano', '8.º Ano', '9.º Ano'],
    'Matemática A': ['10.º Ano', '11.º Ano', '12.º Ano'],
    'Matemática B': ['10.º Ano', '11.º Ano']
  };
  const currentSubject = v.subject || 'Matemática';
  const currentGrade = v.grade || '7.º Ano';
  const availableGrades = gradesBySubject[currentSubject] || gradesBySubject['Matemática'];
  const matchingFolders = allFolders.filter(f => f.subject === currentSubject && f.grade === currentGrade);
  const currentFolderId = v.folder_id || '';

  return `
    <div class="admin-field-row">
      <div class="admin-field"><label>Disciplina *</label><select id="field_subject" required onchange="updateGradeOptions();updateFolderOptions()">
        ${subjects.map(s => `<option value="${s}" ${currentSubject === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></div>
      <div class="admin-field"><label>Ano Escolar *</label><select id="field_grade" required onchange="updateFolderOptions()">
        ${availableGrades.map(g => `<option value="${g}" ${currentGrade === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select></div>
    </div>
    <div class="admin-field"><label>Pasta</label><select id="field_folder_id">
      <option value="">Sem pasta</option>
      ${matchingFolders.map(f => `<option value="${f.id}" ${currentFolderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
    </select></div>
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
          ${hasPdf ? `<div class="admin-pdf-file"><a href="${esc(v.pdf_url)}" target="_blank">PDF atual</a><button type="button" class="admin-action-btn danger" onclick="removePdf()">Remover</button></div>` : ''}
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

function updateGradeOptions() {
  const gradesBySubject = {
    'Matemática': ['7.º Ano', '8.º Ano', '9.º Ano'],
    'Matemática A': ['10.º Ano', '11.º Ano', '12.º Ano'],
    'Matemática B': ['10.º Ano', '11.º Ano']
  };
  const subject = document.getElementById('field_subject').value;
  const gradeSelect = document.getElementById('field_grade');
  const currentGrade = gradeSelect.value;
  const grades = gradesBySubject[subject] || [];
  gradeSelect.innerHTML = grades.map(g => `<option value="${g}" ${currentGrade === g ? 'selected' : ''}>${g}</option>`).join('');
}

function updateFolderOptions() {
  const subject = document.getElementById('field_subject').value;
  const grade = document.getElementById('field_grade').value;
  const folderSelect = document.getElementById('field_folder_id');
  if (!folderSelect) return;
  const currentFolder = folderSelect.value;
  const matchingFolders = allFolders.filter(f => f.subject === subject && f.grade === grade);
  folderSelect.innerHTML = '<option value="">Sem pasta</option>'
    + matchingFolders.map(f => `<option value="${f.id}" ${currentFolder === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
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

function getPlatformLoginFormHtml(data) {
  const l = data || {};
  return `
    <div class="admin-field"><label>Nome da Plataforma *</label><input type="text" id="field_platform_name" value="${esc(l.platform_name || '')}" required placeholder="Ex: Google Classroom"></div>
    <div class="admin-field"><label>Email *</label><input type="email" id="field_login_email" value="${esc(l.email || '')}" required placeholder="utilizador@email.com"></div>
    <div class="admin-field"><label>Password *</label><div class="admin-password-field"><input type="password" id="field_login_password" value="${esc(l.password || '')}" required><button type="button" class="admin-action-btn" onclick="togglePasswordField('field_login_password', this)">Mostrar</button></div></div>
    <div class="admin-field"><label>URL de Login</label><input type="url" id="field_login_url" value="${esc(l.url || '')}" placeholder="https://..."></div>
    <div class="admin-field"><label>Notas</label><textarea id="field_login_notes" placeholder="Notas adicionais...">${esc(l.notes || '')}</textarea></div>`;
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

function togglePasswordField(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (field.type === 'password') {
    field.type = 'text';
    btn.textContent = 'Ocultar';
  } else {
    field.type = 'password';
    btn.textContent = 'Mostrar';
  }
}

async function openModal(type, id) {
  editingType = type;
  editingId = id || null;
  pendingPdfFile = null;
  removePdfFlag = false;

  let data = null;
  if (id) {
    const table = type === 'video' ? 'videos' : type === 'platform_login' ? 'platform_logins' : type + 's';
    const { data: row } = await db.from(table).select('*').eq('id', id).single();
    data = row;
  }

  const titles = { video: 'Vídeo YouTube', testimonial: 'Testemunho', product: 'Produto da Loja', platform_login: 'Login de Plataforma' };
  document.getElementById('modalTitle').textContent = id ? 'Editar ' + titles[type] : 'Adicionar ' + titles[type];

  const formEl = document.getElementById('modalForm');
  if (type === 'video') formEl.innerHTML = getVideoFormHtml(data);
  else if (type === 'testimonial') formEl.innerHTML = getTestimonialFormHtml(data);
  else if (type === 'product') formEl.innerHTML = getProductFormHtml(data);
  else if (type === 'platform_login') formEl.innerHTML = getPlatformLoginFormHtml(data);

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
    obj.subject = document.getElementById('field_subject').value;
    obj.grade = document.getElementById('field_grade').value;
    obj.title = document.getElementById('field_title').value;
    obj.youtube_url = document.getElementById('field_youtube_url').value;
    obj.topic = document.getElementById('field_topic').value;
    obj.description = document.getElementById('field_description').value;
    obj.order = parseInt(document.getElementById('field_order').value) || 0;
    obj.featured = document.getElementById('field_featured').checked;
    obj.draft = document.getElementById('field_draft').checked;
    const folderVal = document.getElementById('field_folder_id')?.value;
    obj.folder_id = folderVal || null;

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
  } else if (editingType === 'platform_login') {
    obj.platform_name = document.getElementById('field_platform_name').value;
    obj.email = document.getElementById('field_login_email').value;
    obj.password = document.getElementById('field_login_password').value;
    obj.url = document.getElementById('field_login_url').value;
    obj.notes = document.getElementById('field_login_notes').value;
  }

  const table = editingType === 'video' ? 'videos' : editingType === 'platform_login' ? 'platform_logins' : editingType + 's';
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
