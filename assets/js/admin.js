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
let adminSubjects = [];
let adminGrades = [];
let adminNav = { level: 'subjects' };
let allTestimonials = [];
let testimonialTab = 'aulas';

const TESTIMONIAL_CATEGORIES = {
  aulas: 'Feedback das Aulas',
  livro: 'Feedback do Livro'
};

const FOLDER_ICONS = [
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
];

const SUBJECT_ICONS = [
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 4h10"/><path d="M4 20c1.5 0 3-.5 4-2 .85-1.27 2-4 2-4s.25 3.06 1 4c.5.66 1.5 2 3 2s3-.5 4-2V4"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h4c2 0 4 1.5 4 4s-2 4-4 4H6"/><path d="M6 12h2c2 0 4 1.5 4 4s-2 4-4 4H4"/><path d="M16 4h4"/><path d="M18 4v16"/><path d="M16 20h4"/></svg>'
];

function pickIcon(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i) | 0;
  return FOLDER_ICONS[Math.abs(h) % FOLDER_ICONS.length];
}

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

  const email = currentUser.email || '';
  const name = email.split('@')[0];
  const initial = (name.charAt(0) || 'A').toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarUserName').textContent = name;
  document.getElementById('welcomeMessage').textContent = 'Bem-vindo, ' + name + '!';

  loadAll();
}

// ============================================
// SIDEBAR / NAVIGATION
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
    closeSidebar();
  });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.querySelector('.admin-sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.add('visible');
});

function closeSidebar() {
  document.querySelector('.admin-sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('visible');
}

// ============================================
// LOAD DATA
// ============================================
async function loadAll() {
  await loadSubjects();
  await Promise.all([loadVideos(), loadFolders(), loadTestimonials(), loadNews(), loadProducts(), loadLogins(), loadFaq()]);
}

async function loadSubjects() {
  const [subRes, grRes] = await Promise.all([
    db.from('subjects').select('*').order('display_order', { ascending: true }),
    db.from('subject_grades').select('*').order('display_order', { ascending: true })
  ]);
  if (subRes.error) { showToast('Erro ao carregar disciplinas', 'error'); return; }
  adminSubjects = subRes.data || [];
  adminGrades = grRes.data || [];
}

function getSubjectColor(name) {
  const s = adminSubjects.find(x => x.name === name);
  return s ? s.color : '#0E8C8F';
}

function getSubjectIconIndex(name) {
  const s = adminSubjects.find(x => x.name === name);
  return s ? s.icon_index : 0;
}

function getGradesForSubject(name) {
  const s = adminSubjects.find(x => x.name === name);
  if (!s) return [];
  return adminGrades.filter(g => g.subject_id === s.id).map(g => g.grade);
}

async function loadVideos() {
  const { data, error } = await db.from('videos').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar vídeos', 'error'); return; }
  window._adminVideos = data || [];
  renderVideos(window._adminVideos);
  renderAdminFolders();
  updateStats();
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
  allTestimonials = data || [];
  renderTestimonials();
  updateStats();
}

function switchTestimonialTab(tab) {
  testimonialTab = tab;
  document.querySelectorAll('#testimonialTabs .admin-subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === tab);
  });
  renderTestimonials();
}

async function loadProducts() {
  const { data, error } = await db.from('products').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar produtos', 'error'); return; }
  renderProducts(data || []);
  updateStats();
}

async function loadLogins() {
  const { data, error } = await db.from('platform_logins').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar logins', 'error'); return; }
  renderLogins(data || []);
  updateStats();
}

async function loadNews() {
  const { data, error } = await db.from('news').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar notícias', 'error'); return; }
  renderNews(data || []);
  updateStats();
}

// ============================================
// STATS
// ============================================
function updateStats() {
  const videos = window._adminVideos || [];
  document.getElementById('statVideos').textContent = videos.length;
  document.getElementById('statTestimonials').textContent = allTestimonials.filter(t => t.active !== false).length;
  document.getElementById('statNews').textContent = document.getElementById('newsEmpty').style.display === 'none' ? document.querySelectorAll('#newsList .admin-list-item').length : 0;
  document.getElementById('statProducts').textContent = document.getElementById('productsEmpty').style.display === 'none' ? document.querySelectorAll('#productsList .admin-list-item').length : 0;
  document.getElementById('statLogins').textContent = document.getElementById('loginsEmpty').style.display === 'none' ? document.querySelectorAll('#loginsList .admin-list-item').length : 0;
  document.getElementById('statFaq').textContent = window._adminFaqCount || 0;
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
  if (!token) throw new Error('Token GitHub nao configurado. Vai a Supabase > site_config e adiciona github_token.');

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

let pendingImageFile = null;
let removeImageFlag = false;

function handleImagePreview(input) {
  const file = input.files[0];
  if (!file) return;
  pendingImageFile = file;
  removeImageFlag = false;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('imagePreview').innerHTML = '<div class="admin-image-file"><img src="' + e.target.result + '" class="admin-image-preview-img" alt="Preview"><span>' + esc(file.name) + ' (' + (file.size / 1024).toFixed(0) + ' KB)</span><button type="button" class="admin-action-btn danger" onclick="removeImage()">Remover</button></div>';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  pendingImageFile = null;
  removeImageFlag = true;
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('field_news_image').value = '';
}

async function uploadImage(file) {
  const token = await getGithubToken();
  if (!token) throw new Error('Token GitHub nao configurado.');
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  const filename = cleanName + '-' + Date.now().toString(36) + '.' + ext;
  const path = GITHUB_IMAGE_PATH + '/' + filename;
  const content = await fileToBase64(file);
  const res = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'Upload Image: ' + file.name, content })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao enviar imagem para GitHub');
  }
  return GITHUB_IMAGE_BASE_URL + '/' + filename;
}

async function deleteImage(url) {
  if (!url || !url.includes(GITHUB_IMAGE_PATH)) return;
  const token = await getGithubToken();
  if (!token) return;
  const filename = url.split('/').pop();
  const path = GITHUB_IMAGE_PATH + '/' + filename;
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
    body: JSON.stringify({ message: 'Delete Image: ' + filename, sha: fileData.sha })
  });
}

// ============================================
// RENDER LISTS
// ============================================
function renderVideos(items) {
  const list = document.getElementById('videosList');
  const empty = document.getElementById('videosEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header videos">'
    + '<span>Vídeo</span><span>Disciplina</span><span>Estado</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(v => {
    const id = extractVideoId(v.youtube_url);
    const thumb = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
    const folder = v.folder_id ? allFolders.find(f => f.id === v.folder_id) : null;
    const badges = [];
    if (v.featured) badges.push('<span class="admin-badge info">Destaque</span>');
    if (v.draft) badges.push('<span class="admin-badge inactive">Rascunho</span>');
    const pdfCount = getPdfUrls(v).length;
    return `<div class="admin-list-item videos">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${thumb ? `<img src="${thumb}" class="admin-list-thumb" alt="${v.title}" onerror="this.style.display='none'">` : ''}
        <div class="admin-list-info">
          <h4>${esc(v.title)}</h4>
          <p>${v.topic ? esc(v.topic) : ''}${folder ? ' · ' + esc(folder.name) : ''}${pdfCount ? ' · ' + pdfCount + ' PDF' + (pdfCount !== 1 ? 's' : '') : ''}</p>
        </div>
      </div>
      <div style="font-size:0.8rem;color:var(--admin-text-secondary)">${esc(v.subject || 'Matemática')}<br>${esc(v.grade || '')}</div>
      <div>${badges.join(' ')}</div>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('video','${v.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('videos','${v.id}')">Apagar</button>
      </div>
    </div>`;
  }).join('');

  list.innerHTML = html;
  updateStats();
}

function renderTestimonials() {
  const list = document.getElementById('testimonialsList');
  const empty = document.getElementById('testimonialsEmpty');
  const items = allTestimonials.filter(t => (t.category || 'aulas') === testimonialTab);
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header testimonials">'
    + '<span>Autor</span><span>Estado</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(t => `
    <div class="admin-list-item testimonials">
      <div class="admin-list-info">
        <h4>${esc(t.author_name)} ${t.author_role ? '<span style="font-weight:400;color:var(--admin-text-secondary);font-size:0.8rem">— ' + esc(t.author_role) + '</span>' : ''}</h4>
        <p>"${esc(t.content.substring(0, 80))}${t.content.length > 80 ? '...' : ''}"</p>
      </div>
      <span class="admin-badge ${t.active ? 'active' : 'inactive'}">${t.active ? 'Ativo' : 'Inativo'}</span>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('testimonial','${t.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('testimonials','${t.id}')">Apagar</button>
      </div>
    </div>`).join('');

  list.innerHTML = html;
  updateStats();
}

function renderProducts(items) {
  const list = document.getElementById('productsList');
  const empty = document.getElementById('productsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header products">'
    + '<span>Produto</span><span>Preço</span><span>Estado</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(p => `
    <div class="admin-list-item products">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${p.image_url ? `<img src="${esc(p.image_url)}" class="admin-list-thumb" alt="${p.name}" onerror="this.style.display='none'">` : ''}
        <div class="admin-list-info">
          <h4>${esc(p.name)}</h4>
          <p>${esc(p.category)}${p.featured ? ' · Destaque' : ''}</p>
        </div>
      </div>
      <div style="font-size:0.875rem;font-weight:600">${p.price}&euro;${p.original_price ? ' <s style="color:var(--admin-text-tertiary);font-weight:400;font-size:0.8rem">' + p.original_price + '&euro;</s>' : ''}</div>
      <span class="admin-badge ${p.active ? 'active' : 'inactive'}">${p.active ? 'Ativo' : 'Inativo'}</span>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('product','${p.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('products','${p.id}')">Apagar</button>
      </div>
    </div>`).join('');

  list.innerHTML = html;
  updateStats();
}

function renderLogins(items) {
  const list = document.getElementById('loginsList');
  const empty = document.getElementById('loginsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header logins">'
    + '<span>Plataforma</span><span>Credenciais</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(l => `
    <div class="admin-list-item logins">
      <div class="admin-list-info">
        <h4>${esc(l.platform_name)}</h4>
        ${l.url ? '<p><a href="' + esc(l.url) + '" target="_blank" style="color:var(--admin-primary);font-weight:500">' + esc(l.url) + '</a></p>' : ''}
      </div>
      <div>
        <p style="font-size:0.8rem;color:var(--admin-text-secondary)">${esc(l.email)}</p>
        <div class="admin-login-password-row">
          <span class="admin-login-password" id="pw-${l.id}">••••••••</span>
          <button class="admin-action-btn" onclick="toggleLoginPassword('${l.id}', '${esc(l.password)}')">Mostrar</button>
        </div>
      </div>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openModal('platform_login','${l.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteItem('platform_logins','${l.id}')">Apagar</button>
      </div>
    </div>`).join('');

  list.innerHTML = html;
  updateStats();
}

function renderNews(items) {
  const list = document.getElementById('newsList');
  const empty = document.getElementById('newsEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header news">'
    + '<span>Notícia</span><span>Data</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(n => {
    const date = n.created_at ? new Date(n.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const preview = n.content ? n.content.substring(0, 80) + (n.content.length > 80 ? '...' : '') : '';
    return `<div class="admin-list-item news">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${n.image_url ? `<img src="${esc(n.image_url)}" class="admin-news-thumb" alt="${esc(n.title)}" onerror="this.style.display='none'">` : `<div class="admin-news-thumb admin-news-thumb-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg></div>`}
        <div class="admin-list-info">
          <h4>${esc(n.title)}</h4>
          <p>${esc(preview)}</p>
        </div>
      </div>
      <div style="font-size:0.8rem;color:var(--admin-text-secondary)">${date}</div>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openNewsModal('${n.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteNews('${n.id}')">Apagar</button>
      </div>
    </div>`;
  }).join('');

  list.innerHTML = html;
  updateStats();
}

function toggleLoginPassword(id, pw) {
  const el = document.getElementById('pw-' + id);
  const btn = el.nextElementSibling;
  if (el.textContent === '••••••••') {
    el.textContent = pw;
    el.classList.add('admin-login-password-visible');
    btn.textContent = 'Ocultar';
  } else {
    el.textContent = '••••••••';
    el.classList.remove('admin-login-password-visible');
    btn.textContent = 'Mostrar';
  }
}

// ============================================
// SUBJECTS & GRADES CRUD (Admin)
// ============================================
function renderAdminFolders() {
  if (adminNav.level === 'subjects') renderAdminSubjects();
  else if (adminNav.level === 'grades') renderAdminGrades(adminNav.subject);
  else if (adminNav.level === 'folders') renderAdminFolderList(adminNav.subject, adminNav.grade);
}

function renderAdminSubjects() {
  adminNav = { level: 'subjects' };
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  document.getElementById('foldersBreadcrumb').style.display = 'none';
  document.getElementById('foldersViewTitle').textContent = 'Disciplinas';
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Disciplina';
  document.getElementById('foldersAddBtn').setAttribute('onclick', 'openSubjectModal()');

  if (!adminSubjects.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    empty.innerHTML = `
      <div class="admin-empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
      <h3>Nenhuma disciplina criada</h3>
      <p>Clica em "Adicionar Disciplina" para começar.</p>`;
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'flex';

  let html = '';
  adminSubjects.forEach(s => {
    const grades = adminGrades.filter(g => g.subject_id === s.id);
    const folderCount = allFolders.filter(f => f.subject === s.name).length;
    const videoCount = (window._adminVideos || []).filter(v => v.subject === s.name).length;
    html += '<div class="admin-folder-item">'
      + '<div class="admin-folder-icon" style="background:' + s.color + '18;color:' + s.color + '">'
      + (SUBJECT_ICONS[s.icon_index] || SUBJECT_ICONS[0])
      + '</div>'
      + '<div class="admin-folder-info" style="cursor:pointer" onclick="adminNavTo(\'' + esc(s.name) + '\')"><h4>' + esc(s.name) + '</h4>'
      + '<p>' + grades.length + ' ano' + (grades.length !== 1 ? 's' : '') + ' · ' + folderCount + ' pasta' + (folderCount !== 1 ? 's' : '') + ' · ' + videoCount + ' vídeo' + (videoCount !== 1 ? 's' : '') + '</p></div>'
      + '<div class="admin-list-actions">'
      + '<button class="admin-action-btn" onclick="event.stopPropagation();openSubjectModal(\'' + s.id + '\')">Editar</button>'
      + '<button class="admin-action-btn danger" onclick="event.stopPropagation();deleteSubject(\'' + s.id + '\')">Apagar</button>'
      + '</div>'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.25;cursor:pointer" onclick="adminNavTo(\'' + esc(s.name) + '\')"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</div>';
  });
  grid.innerHTML = html;
}

function renderAdminGrades(subject) {
  adminNav = { level: 'grades', subject: subject };
  const subj = adminSubjects.find(s => s.name === subject);
  const grades = subj ? adminGrades.filter(g => g.subject_id === subj.id) : [];
  const color = subj ? subj.color : '#0E8C8F';
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  const bc = document.getElementById('foldersBreadcrumb');
  document.getElementById('foldersViewTitle').textContent = subject;
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Ano';
  document.getElementById('foldersAddBtn').setAttribute('onclick', 'openGradeModal(\'' + esc(subject) + '\')');

  bc.innerHTML = '<a href="#" onclick="renderAdminSubjects();return false">Disciplinas</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<strong>' + esc(subject) + '</strong>';
  bc.style.display = 'flex';

  if (!grades.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    empty.innerHTML = `
      <div class="admin-empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>
      <h3>Nenhum ano adicionado</h3>
      <p>Clica em "Adicionar Ano" para adicionar anos a esta disciplina.</p>`;
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'flex';

  let html = '';
  grades.forEach(g => {
    const num = getGradeDisplay(g.grade);
    const folderCount = allFolders.filter(f => f.subject === subject && f.grade === g.grade).length;
    const videoCount = (window._adminVideos || []).filter(v => v.subject === subject && v.grade === g.grade).length;
    html += '<div class="admin-folder-item">'
      + '<div class="admin-folder-grade" style="border-color:' + color + '">' + num + '</div>'
      + '<div class="admin-folder-info" style="cursor:pointer" onclick="adminNavTo(\'' + esc(subject) + '\',\'' + esc(g.grade) + '\')"><h4>' + esc(g.grade) + '</h4>'
      + '<p>' + folderCount + ' pasta' + (folderCount !== 1 ? 's' : '') + ' · ' + videoCount + ' vídeo' + (videoCount !== 1 ? 's' : '') + '</p></div>'
      + '<div class="admin-list-actions">'
      + '<button class="admin-action-btn" onclick="event.stopPropagation();openGradeModal(\'' + esc(subject) + '\',\'' + g.id + '\')">Editar</button>'
      + '<button class="admin-action-btn danger" onclick="event.stopPropagation();deleteGrade(\'' + g.id + '\',\'' + esc(subject) + '\')">Apagar</button>'
      + '</div>'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.25;cursor:pointer" onclick="adminNavTo(\'' + esc(subject) + '\',\'' + esc(g.grade) + '\')"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</div>';
  });
  grid.innerHTML = html;
}

function renderAdminFolderList(subject, grade) {
  adminNav = { level: 'folders', subject: subject, grade: grade };
  const folders = allFolders.filter(f => f.subject === subject && f.grade === grade);
  const grid = document.getElementById('adminFoldersList');
  const empty = document.getElementById('adminFoldersEmpty');
  const bc = document.getElementById('foldersBreadcrumb');
  document.getElementById('foldersViewTitle').textContent = subject + ' › ' + grade;
  document.getElementById('foldersAddBtnText').textContent = 'Adicionar Pasta';
  document.getElementById('foldersAddBtn').setAttribute('onclick', 'openFolderModal()');

  bc.innerHTML = '<a href="#" onclick="renderAdminSubjects();return false">Disciplinas</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<a href="#" onclick="adminNavTo(\'' + esc(subject) + '\');return false">' + esc(subject) + '</a>'
    + ' <span class="admin-bc-sep">/</span> '
    + '<strong>' + esc(grade) + '</strong>';
  bc.style.display = 'flex';

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
      + pickIcon(f.name)
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
// SUBJECT CRUD
// ============================================
async function openSubjectModal(id) {
  let data = null;
  if (id) {
    const { data: row } = await db.from('subjects').select('*').eq('id', id).single();
    data = row;
  }
  const f = data || {};

  document.getElementById('modalTitle').textContent = id ? 'Editar Disciplina' : 'Adicionar Disciplina';
  const formEl = document.getElementById('modalForm');

  let iconOptions = '';
  SUBJECT_ICONS.forEach((svg, idx) => {
    const selected = (f.icon_index || 0) === idx ? 'selected' : '';
    iconOptions += `<option value="${idx}" ${selected}>Ícone ${idx + 1}</option>`;
  });

  formEl.innerHTML = `
    <div class="admin-field"><label>Nome da Disciplina *</label><input type="text" id="field_subject_name" value="${esc(f.name || '')}" required placeholder="Ex: Matemática C"></div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Cor</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="field_subject_color" value="${f.color || '#0E8C8F'}" style="width:48px;height:48px;padding:2px;border-radius:8px;cursor:pointer"><input type="text" id="field_subject_color_text" value="${f.color || '#0E8C8F'}" style="flex:1" placeholder="#0E8C8F"></div></div>
      <div class="admin-field"><label>Ícone</label><select id="field_subject_icon">${iconOptions}</select></div>
    </div>
    <div class="admin-field"><label>Ordem de exibição</label><input type="number" id="field_subject_order" value="${f.display_order || 0}"></div>
    <div class="admin-field" style="margin-top:12px"><label>Pré-visualização</label><div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--admin-surface-hover);border-radius:10px" id="subjectPreview"><div id="subjectPreviewIcon" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px;color:${f.color || '#0E8C8F'};background:${(f.color || '#0E8C8F') + '18'}">${SUBJECT_ICONS[f.icon_index || 0]}</div><span style="font-weight:600">${esc(f.name || 'Nova Disciplina')}</span></div></div>
    <div class="admin-modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  const colorInput = document.getElementById('field_subject_color');
  const colorText = document.getElementById('field_subject_color_text');
  const iconSelect = document.getElementById('field_subject_icon');
  const nameInput = document.getElementById('field_subject_name');

  function updatePreview() {
    const c = colorInput.value;
    colorText.value = c;
    const idx = parseInt(iconSelect.value) || 0;
    const iconEl = document.getElementById('subjectPreviewIcon');
    iconEl.style.color = c;
    iconEl.style.background = c + '18';
    iconEl.innerHTML = SUBJECT_ICONS[idx] || SUBJECT_ICONS[0];
    document.getElementById('subjectPreview').querySelector('span').textContent = nameInput.value || 'Nova Disciplina';
  }

  colorInput.addEventListener('input', updatePreview);
  colorText.addEventListener('input', function() {
    if (/^#[0-9a-f]{6}$/i.test(this.value)) {
      colorInput.value = this.value;
      updatePreview();
    }
  });
  iconSelect.addEventListener('change', updatePreview);
  nameInput.addEventListener('input', updatePreview);

  formEl.onsubmit = (e) => { e.preventDefault(); saveSubject(id); };
  document.getElementById('modal').style.display = 'flex';
}

async function saveSubject(editId) {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const obj = {
    name: document.getElementById('field_subject_name').value,
    color: document.getElementById('field_subject_color').value,
    icon_index: parseInt(document.getElementById('field_subject_icon').value) || 0,
    display_order: parseInt(document.getElementById('field_subject_order').value) || 0
  };

  let result;
  if (editId) {
    result = await db.from('subjects').update(obj).eq('id', editId);
  } else {
    result = await db.from('subjects').insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editId ? 'Disciplina atualizada!' : 'Disciplina criada!', 'success');
  closeModal();
  await loadSubjects();
  renderAdminFolders();
}

async function deleteSubject(id) {
  const subj = adminSubjects.find(s => s.id === id);
  if (!subj) return;
  if (!confirm('Tem certeza que queres apagar a disciplina "' + subj.name + '"?\nTodos os anos, pastas e vídeos associados ficarão sem disciplina.')) return;
  const { error } = await db.from('subjects').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('Disciplina apagada!', 'success');
  await loadSubjects();
  renderAdminFolders();
}

// ============================================
// GRADE CRUD
// ============================================
async function openGradeModal(subject, id) {
  let data = null;
  if (id) {
    const { data: row } = await db.from('subject_grades').select('*').eq('id', id).single();
    data = row;
  }
  const f = data || {};

  document.getElementById('modalTitle').textContent = id ? 'Editar Ano' : 'Adicionar Ano';
  const formEl = document.getElementById('modalForm');
  formEl.innerHTML = `
    <div class="admin-field"><label>Disciplina</label><input type="text" value="${esc(subject)}" disabled style="background:var(--admin-surface-hover);opacity:0.8"></div>
    <div class="admin-field"><label>Ano Escolar *</label><input type="text" id="field_grade_name" value="${esc(f.grade || '')}" required placeholder="Ex: 7.º Ano"></div>
    <div class="admin-field"><label>Ordem de exibição</label><input type="number" id="field_grade_order" value="${f.display_order || 0}"></div>
    <div class="admin-modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  formEl.onsubmit = (e) => { e.preventDefault(); saveGrade(subject, id); };
  document.getElementById('modal').style.display = 'flex';
}

async function saveGrade(subject, editId) {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const subj = adminSubjects.find(s => s.name === subject);
  if (!subj) {
    showToast('Erro: Disciplina não encontrada', 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  const obj = {
    subject_id: subj.id,
    grade: document.getElementById('field_grade_name').value,
    display_order: parseInt(document.getElementById('field_grade_order').value) || 0
  };

  let result;
  if (editId) {
    result = await db.from('subject_grades').update(obj).eq('id', editId);
  } else {
    result = await db.from('subject_grades').insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editId ? 'Ano atualizado!' : 'Ano adicionado!', 'success');
  closeModal();
  await loadSubjects();
  renderAdminFolders();
}

async function deleteGrade(id, subject) {
  if (!confirm('Tem certeza que queres apagar este ano?\nAs pastas e vídeos associados ficarão sem ano.')) return;
  const { error } = await db.from('subject_grades').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('Ano apagado!', 'success');
  await loadSubjects();
  renderAdminFolders();
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
  let currentSubject = f.subject || adminNav.subject || (adminSubjects.length ? adminSubjects[0].name : 'Matemática');
  let currentGrade = f.grade || adminNav.grade || (getGradesForSubject(currentSubject)[0] || '7.º Ano');

  document.getElementById('modalTitle').textContent = id ? 'Editar Pasta' : 'Adicionar Pasta';
  const formEl = document.getElementById('modalForm');

  const subjectOptions = adminSubjects.map(s =>
    `<option value="${esc(s.name)}" ${currentSubject === s.name ? 'selected' : ''}>${esc(s.name)}</option>`
  ).join('');

  const gradeOptions = getGradesForSubject(currentSubject).map(g =>
    `<option value="${g}" ${currentGrade === g ? 'selected' : ''}>${g}</option>`
  ).join('');

  formEl.innerHTML = `
    <div class="admin-field-row">
      <div class="admin-field"><label>Disciplina *</label><select id="field_folder_subject" required onchange="updateFolderGradeOptions()">
        ${subjectOptions}
      </select></div>
      <div class="admin-field"><label>Ano Escolar *</label><select id="field_folder_grade" required>
        ${gradeOptions}
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
  const subject = document.getElementById('field_folder_subject').value;
  const gradeSelect = document.getElementById('field_folder_grade');
  const grades = getGradesForSubject(subject);
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
// NEWS CRUD
// ============================================
async function openNewsModal(id) {
  editingType = 'news';
  editingId = id || null;
  pendingImageFile = null;
  removeImageFlag = false;

  let data = null;
  if (id) {
    const { data: row } = await db.from('news').select('*').eq('id', id).single();
    data = row;
  }
  const n = data || {};

  document.getElementById('modalTitle').textContent = id ? 'Editar Notícia' : 'Adicionar Notícia';
  const formEl = document.getElementById('modalForm');

  const dateValue = n.created_at ? new Date(n.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const hasImage = n.image_url && n.image_url.trim();

  formEl.innerHTML = `
    <div class="admin-field"><label>Título *</label><input type="text" id="field_news_title" value="${esc(n.title || '')}" required placeholder="Título da notícia"></div>
    <div class="admin-field"><label>Data</label><input type="date" id="field_news_date" value="${dateValue}"></div>
    <div class="admin-field"><label>Conteúdo *</label><textarea id="field_news_content" required placeholder="Escreve o conteúdo da notícia..." style="min-height:180px">${esc(n.content || '')}</textarea></div>
    <div class="admin-field">
      <label>Imagem</label>
      <div class="admin-image-upload">
        <input type="file" id="field_news_image" accept="image/*" style="display:none" onchange="handleImagePreview(this)">
        <button type="button" class="btn btn-secondary admin-btn-full" onclick="document.getElementById('field_news_image').click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          ${hasImage ? 'Substituir Imagem' : 'Carregar Imagem'}
        </button>
        <div id="imagePreview" class="admin-image-preview">
          ${hasImage ? '<div class="admin-image-file"><img src="' + esc(n.image_url) + '" class="admin-image-preview-img" alt=""><span>Imagem atual</span><button type="button" class="admin-action-btn danger" onclick="removeImage()">Remover</button></div>' : ''}
        </div>
      </div>
    </div>
    <div class="admin-modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  formEl.onsubmit = (e) => { e.preventDefault(); saveNews(); };
  document.getElementById('modal').style.display = 'flex';
}

async function saveNews() {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const obj = {
    title: document.getElementById('field_news_title').value,
    content: document.getElementById('field_news_content').value
  };

  const dateVal = document.getElementById('field_news_date').value;
  if (dateVal) {
    obj.created_at = new Date(dateVal + 'T12:00:00').toISOString();
  }

  if (removeImageFlag && !pendingImageFile) {
    if (editingId) {
      const old = await db.from('news').select('image_url').eq('id', editingId).single();
      if (old.data?.image_url) await deleteImage(old.data.image_url);
    }
    obj.image_url = null;
  } else if (pendingImageFile) {
    try {
      if (editingId) {
        const old = await db.from('news').select('image_url').eq('id', editingId).single();
        if (old.data?.image_url) await deleteImage(old.data.image_url);
      }
      obj.image_url = await uploadImage(pendingImageFile);
    } catch(e) {
      showToast('Erro ao upload imagem: ' + e.message, 'error');
      btn.innerHTML = 'Guardar';
      btn.disabled = false;
      return;
    }
  }

  let result;
  if (editingId) {
    result = await db.from('news').update(obj).eq('id', editingId);
  } else {
    result = await db.from('news').insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editingId ? 'Notícia atualizada!' : 'Notícia criada!', 'success');
  closeModal();
  loadNews();
}

async function deleteNews(id) {
  if (!confirm('Tem certeza que queres apagar esta notícia?')) return;
  const { data } = await db.from('news').select('image_url').eq('id', id).single();
  if (data?.image_url) await deleteImage(data.image_url);
  const { error } = await db.from('news').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('Notícia apagada!', 'success');
  loadNews();
}

// ============================================
// MODAL / FORMS
// ============================================
function getVideoFormHtml(data) {
  const v = data || {};

  const currentSubject = v.subject || (adminSubjects.length ? adminSubjects[0].name : 'Matemática');
  const currentGrade = v.grade || (getGradesForSubject(currentSubject)[0] || '7.º Ano');
  const availableGrades = getGradesForSubject(currentSubject);
  const matchingFolders = allFolders.filter(f => f.subject === currentSubject && f.grade === currentGrade);
  const currentFolderId = v.folder_id || '';

  const subjectOptions = adminSubjects.map(s =>
    `<option value="${esc(s.name)}" ${currentSubject === s.name ? 'selected' : ''}>${esc(s.name)}</option>`
  ).join('');

  const gradeOptions = availableGrades.map(g =>
    `<option value="${g}" ${currentGrade === g ? 'selected' : ''}>${g}</option>`
  ).join('');

  const folderOptions = matchingFolders.map(f =>
    `<option value="${f.id}" ${currentFolderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`
  ).join('');

  return `
    <div class="admin-field-row">
      <div class="admin-field"><label>Disciplina *</label><select id="field_subject" required onchange="updateGradeOptions();updateFolderOptions()">
        ${subjectOptions}
      </select></div>
      <div class="admin-field"><label>Ano Escolar *</label><select id="field_grade" required onchange="updateFolderOptions()">
        ${gradeOptions}
      </select></div>
    </div>
    <div class="admin-field"><label>Pasta</label><select id="field_folder_id">
      <option value="">Sem pasta</option>
      ${folderOptions}
    </select></div>
    <div class="admin-field"><label>Título *</label><input type="text" id="field_title" value="${esc(v.title || '')}" required></div>
    <div class="admin-field"><label>URL do YouTube *</label><input type="url" id="field_youtube_url" value="${esc(v.youtube_url || '')}" required placeholder="https://www.youtube.com/watch?v=..."></div>
    <div class="admin-field"><label>Tópico</label><input type="text" id="field_topic" value="${esc(v.topic || '')}" placeholder="Ex: Derivadas"></div>
    <div class="admin-field"><label>Descrição</label><textarea id="field_description" placeholder="Descrição da aula...">${esc(v.description || '')}</textarea></div>
    <div class="admin-field">
      <label>PDFs da aula (máx. 5)</label>
      <div class="admin-pdf-upload">
        <input type="file" id="field_pdf_files" accept=".pdf" multiple style="display:none" onchange="handlePdfFiles(this)">
        <button type="button" class="btn btn-secondary admin-btn-full" id="pdfAddBtn" onclick="document.getElementById('field_pdf_files').click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Adicionar PDF
        </button>
        <p class="admin-pdf-hint" id="pdfHint"></p>
        <div id="pdfPreview" class="admin-pdf-preview"></div>
      </div>
    </div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Ordem</label><input type="number" id="field_order" value="${v.order || 0}"></div>
      <div style="display:flex;flex-direction:column;gap:14px;padding-top:24px">
        <div class="admin-check-row"><input type="checkbox" id="field_featured" ${v.featured ? 'checked' : ''}><label for="field_featured">Destaque</label></div>
        <div class="admin-check-row"><input type="checkbox" id="field_draft" ${v.draft ? 'checked' : ''}><label for="field_draft">Rascunho (nao publicar)</label></div>
      </div>
    </div>`;
}

function updateGradeOptions() {
  const subject = document.getElementById('field_subject').value;
  const gradeSelect = document.getElementById('field_grade');
  const currentGrade = gradeSelect.value;
  const grades = getGradesForSubject(subject);
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

const STAR_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--admin-warning)" stroke-width="1.5" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';

function initStarInput(initial) {
  const widget = document.getElementById('starInput');
  const label = document.getElementById('starValueLabel');
  const hidden = document.getElementById('field_rating');
  if (!widget || !hidden) return;
  let committed = Math.min(5, Math.max(1, Math.round(parseFloat(initial) || 5)));

  const starSVG = (full) => full
    ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="var(--admin-warning)" stroke="var(--admin-warning)" stroke-width="1.5" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>'
    : STAR_ICON;

  function render(v) {
    widget.querySelectorAll('.star-btn').forEach((btn, i) => {
      btn.innerHTML = starSVG(i < v);
    });
    if (label) label.textContent = v + ' / 5';
  }

  function valueFromBtn(btn) {
    return parseInt(btn.dataset.full, 10) || (parseInt(btn.dataset.i, 10) + 1);
  }

  widget.addEventListener('mousemove', (e) => {
    const btn = e.target.closest('.star-btn');
    if (btn) render(valueFromBtn(btn));
  });
  widget.addEventListener('mouseleave', () => render(committed));
  widget.addEventListener('click', (e) => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    committed = valueFromBtn(btn);
    hidden.value = committed;
    render(committed);
  });

  hidden.value = committed;
  render(committed);
}

function getTestimonialFormHtml(data) {
  const t = data || {};
  const currentCat = t.category || testimonialTab || 'aulas';
  const categoryOptions = Object.keys(TESTIMONIAL_CATEGORIES).map(c =>
    `<option value="${c}" ${currentCat === c ? 'selected' : ''}>${TESTIMONIAL_CATEGORIES[c]}</option>`
  ).join('');
  return `
    <div class="admin-field"><label>Pertence a *</label><select id="field_category">
      ${categoryOptions}
    </select></div>
    <div class="admin-field"><label>Nome do autor *</label><input type="text" id="field_author_name" value="${esc(t.author_name || '')}" required></div>
    <div class="admin-field"><label>Cargo/Funcao</label><input type="text" id="field_author_role" value="${esc(t.author_role || '')}" placeholder="Ex: Aluno do 10. ano"></div>
    <div class="admin-field"><label>Feedback *</label><textarea id="field_content" required placeholder="Escreve o feedback...">${esc(t.content || '')}</textarea></div>
    <div class="admin-field-row">
      <div class="admin-field" style="flex:1.6">
        <label>Avaliação (1 a 5 estrelas)</label>
        <div class="star-input" id="starInput">
          ${Array.from({length:5}, (_, i) => `<span class="star-btn" data-i="${i}" data-full="${i+1}">${STAR_ICON}</span>`).join('')}
        </div>
        <div class="star-value" id="starValueLabel"></div>
        <input type="hidden" id="field_rating" value="${t.rating || 5}">
      </div>
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
      <div class="admin-field"><label>Preço (&euro;) *</label><input type="number" id="field_price" value="${p.price || ''}" step="0.01" required></div>
      <div class="admin-field"><label>Preço original (&euro;)</label><input type="number" id="field_original_price" value="${p.original_price || ''}" step="0.01"></div>
    </div>
    <div class="admin-field"><label>URL da imagem</label><input type="url" id="field_image_url" value="${esc(p.image_url || '')}" placeholder="https://..."></div>
    <div class="admin-field"><label>Link externo (compra)</label><input type="url" id="field_external_url" value="${esc(p.external_url || '')}"></div>
    <div class="admin-field-row">
      <div class="admin-field"><label>Ordem</label><input type="number" id="field_order" value="${p.order || 0}"></div>
      <div style="display:flex;flex-direction:column;gap:14px;padding-top:24px">
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

const MAX_PDFS = 5;
let pdfFiles = [];
let pdfKeepUrls = [];
let pdfRemoveUrls = [];

function getPdfUrls(v) {
  if (!v) return [];
  if (Array.isArray(v.pdf_urls) && v.pdf_urls.length) return v.pdf_urls.filter(u => u && u.trim());
  if (v.pdf_url && v.pdf_url.trim()) return [v.pdf_url];
  return [];
}

function renderPdfPreview() {
  const preview = document.getElementById('pdfPreview');
  const hint = document.getElementById('pdfHint');
  if (!preview) return;

  let html = '';
  pdfKeepUrls.forEach((url, i) => {
    html += `<div class="admin-pdf-file"><a href="${esc(url)}" target="_blank" rel="noopener">${i + 1}. ${esc(url.split('/').pop())}</a><button type="button" class="admin-action-btn danger" onclick="removePdfUrl(${i})">Remover</button></div>`;
  });
  pdfFiles.forEach((file, i) => {
    html += `<div class="admin-pdf-file"><span>${i + 1 + pdfKeepUrls.length}. ${esc(file.name)} (${(file.size / 1024).toFixed(0)} KB)</span><button type="button" class="admin-action-btn danger" onclick="removePdfFile(${i})">Remover</button></div>`;
  });
  preview.innerHTML = html;

  const total = pdfKeepUrls.length + pdfFiles.length;
  const remaining = MAX_PDFS - total;
  const addBtn = document.getElementById('pdfAddBtn');
  if (addBtn) addBtn.style.display = remaining > 0 ? '' : 'none';
  if (hint) {
    hint.textContent = remaining > 0
      ? (total > 0 ? total + ' de ' + MAX_PDFS + ' PDFs adicionados · ' : '') + 'Podes adicionar até ' + remaining + ' PDF' + (remaining !== 1 ? 's' : '')
      : 'Limite de ' + MAX_PDFS + ' PDFs atingido.';
  }
}

function handlePdfFiles(input) {
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  let added = 0;
  files.forEach(file => {
    if (pdfKeepUrls.length + pdfFiles.length >= MAX_PDFS) return;
    if (pdfFiles.some(f => f === file)) return;
    pdfFiles.push(file);
    added++;
  });
  if (added < files.length) showToast('Máximo de ' + MAX_PDFS + ' PDFs por aula.', 'error');
  renderPdfPreview();
}

function removePdfUrl(i) {
  pdfRemoveUrls.push(pdfKeepUrls[i]);
  pdfKeepUrls.splice(i, 1);
  renderPdfPreview();
}

function removePdfFile(i) {
  pdfFiles.splice(i, 1);
  renderPdfPreview();
}

function resetPdfState() {
  pdfFiles = [];
  pdfKeepUrls = [];
  pdfRemoveUrls = [];
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
  resetPdfState();

  let data = null;
  if (id) {
    const table = type === 'video' ? 'videos' : type === 'platform_login' ? 'platform_logins' : type + 's';
    const { data: row } = await db.from(table).select('*').eq('id', id).single();
    data = row;
  }

  const titles = { video: 'Vídeo YouTube', testimonial: 'Feedback', product: 'Produto da Loja', platform_login: 'Login de Plataforma' };
  document.getElementById('modalTitle').textContent = id ? 'Editar ' + titles[type] : 'Adicionar ' + titles[type];

  const formEl = document.getElementById('modalForm');
  if (type === 'video') {
    pdfKeepUrls = getPdfUrls(data);
    formEl.innerHTML = getVideoFormHtml(data);
  }
  else if (type === 'testimonial') formEl.innerHTML = getTestimonialFormHtml(data);
  else if (type === 'product') formEl.innerHTML = getProductFormHtml(data);
  else if (type === 'platform_login') formEl.innerHTML = getPlatformLoginFormHtml(data);

  formEl.innerHTML += `<div class="admin-modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button></div>`;
  if (type === 'testimonial') initStarInput((data && data.rating) || 5);
  if (type === 'video') renderPdfPreview();
  formEl.onsubmit = (e) => { e.preventDefault(); saveItem(); };
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingId = null;
  editingType = null;
  resetPdfState();
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

    for (const url of pdfRemoveUrls) {
      try { if (url) await deletePdf(url); } catch(e) {}
    }
    try {
      const newUrls = [];
      for (const file of pdfFiles) {
        newUrls.push(await uploadPdf(file));
      }
      const finalUrls = pdfKeepUrls.concat(newUrls);
      obj.pdf_urls = finalUrls;
      obj.pdf_url = finalUrls[0] || null;
    } catch(e) {
      showToast('Erro ao upload PDF: ' + e.message, 'error');
      btn.innerHTML = 'Guardar';
      btn.disabled = false;
      return;
    }
  } else if (editingType === 'testimonial') {
    obj.category = document.getElementById('field_category').value;
    obj.author_name = document.getElementById('field_author_name').value;
    obj.author_role = document.getElementById('field_author_role').value;
    obj.content = document.getElementById('field_content').value;
    obj.rating = Math.max(1, Math.min(5, Math.round(parseFloat(document.getElementById('field_rating').value) || 5)));
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
    const { data } = await db.from('videos').select('pdf_url, pdf_urls').eq('id', id).single();
    getPdfUrls(data).forEach(url => deletePdf(url));
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

function getGradeDisplay(g) {
  const m = g.match(/^(\d+)/);
  if (m) return m[1];
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
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

// ============================================
// CHATBOT FAQ CRUD
// ============================================
async function loadFaq() {
  const { data, error } = await db.from('chatbot_faq').select('*').order('order', { ascending: true });
  if (error) { showToast('Erro ao carregar FAQs', 'error'); return; }
  renderFaq(data || []);
  updateStats();
}

function renderFaq(items) {
  const list = document.getElementById('faqList');
  const empty = document.getElementById('faqEmpty');
  if (!items.length) { list.innerHTML = ''; list.style.display = 'none'; empty.style.display = 'flex'; return; }
  empty.style.display = 'none';
  list.style.display = 'block';

  let html = '<div class="admin-list-header faq">'
    + '<span>Pergunta/Resposta</span><span>Palavras-chave</span><span>Estado</span><span style="text-align:right">Ações</span>'
    + '</div>';

  html += items.map(f => {
    const preview = f.answer ? f.answer.substring(0, 80) + (f.answer.length > 80 ? '...' : '') : '';
    const keywords = (f.keywords || []).slice(0, 4).join(', ') + ((f.keywords || []).length > 4 ? '...' : '');
    return `<div class="admin-list-item faq">
      <div class="admin-list-info">
        <h4>${esc(preview)}</h4>
        <p>${esc(keywords)}</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:200px">
        ${(f.keywords || []).slice(0, 6).map(k => '<span style="background:var(--c-primary-light);padding:2px 8px;border-radius:12px;font-size:0.72rem;color:var(--c-primary)">' + esc(k) + '</span>').join('')}
      </div>
      <span class="admin-badge ${f.active !== false ? 'active' : 'inactive'}">${f.active !== false ? 'Ativo' : 'Inativo'}</span>
      <div class="admin-list-actions">
        <button class="admin-action-btn" onclick="openFaqModal('${f.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteFaq('${f.id}')">Apagar</button>
      </div>
    </div>`;
  }).join('');

  list.innerHTML = html;
  window._adminFaqCount = items.length;
  updateStats();
}

async function openFaqModal(id) {
  let data = null;
  if (id) {
    const { data: row } = await db.from('chatbot_faq').select('*').eq('id', id).single();
    data = row;
  }
  const f = data || {};

  document.getElementById('modalTitle').textContent = id ? 'Editar FAQ' : 'Adicionar FAQ';
  const formEl = document.getElementById('modalForm');

  formEl.innerHTML = `
    <div class="admin-field"><label>Resposta *</label><textarea id="field_faq_answer" required placeholder="Escreve a resposta do chatbot..." style="min-height:120px">${esc(f.answer || '')}</textarea></div>
    <div class="admin-field"><label>Palavras-chave *</label><div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;border:1px solid var(--admin-border);border-radius:8px;min-height:42px" id="keywordContainer">
      <input type="text" id="field_faq_keyword_input" placeholder="Escreve e pressiona Enter..." style="border:none;outline:none;flex:1;min-width:100px;font-size:0.85rem;background:transparent">
    </div>
    <p style="font-size:0.75rem;color:var(--admin-text-tertiary);margin-top:4px">Escreve cada palavra-chave e pressiona Enter. Ex: "preço", "custo", "€"</p></div>
    <div class="admin-field" style="display:flex;align-items:center;gap:8px">
      <input type="hidden" id="field_faq_keywords" value="">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem">
        <input type="checkbox" id="field_faq_active" ${f.active !== false ? 'checked' : ''}> FAQ ativa
      </label>
    </div>
    <div class="admin-field"><label>Ordem</label><input type="number" id="field_faq_order" value="${f.order || 0}" style="max-width:100px"></div>
    <div class="admin-modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  const keywordInput = document.getElementById('field_faq_keyword_input');
  const keywordContainer = document.getElementById('keywordContainer');
  const hiddenField = document.getElementById('field_faq_keywords');
  let keywords = [...(f.keywords || [])];

  function renderKeywords() {
    document.querySelectorAll('.faq-keyword-tag').forEach(el => el.remove());
    const input = keywordContainer.querySelector('input');
    keywords.forEach(kw => {
      const tag = document.createElement('span');
      tag.className = 'faq-keyword-tag';
      tag.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:var(--c-primary-light);color:var(--c-primary);padding:2px 10px;border-radius:12px;font-size:0.78rem';
      tag.innerHTML = esc(kw) + '<button type="button" style="background:none;border:none;cursor:pointer;font-size:1rem;line-height:1;color:inherit;padding:0" onclick="removeKeyword(\'' + esc(kw) + '\')">&times;</button>';
      keywordContainer.insertBefore(tag, input);
    });
    hiddenField.value = JSON.stringify(keywords);
  }
  renderKeywords();

  window.removeKeyword = function(kw) {
    keywords = keywords.filter(k => k !== kw);
    renderKeywords();
  };

  keywordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = this.value.trim().toLowerCase();
      if (val && !keywords.includes(val)) {
        keywords.push(val);
        renderKeywords();
      }
      this.value = '';
    }
  });

  formEl.onsubmit = (e) => { e.preventDefault(); saveFaq(id, keywords); };
  document.getElementById('modal').style.display = 'flex';
  setTimeout(() => keywordInput.focus(), 100);
}

async function saveFaq(editId, keywords) {
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const obj = {
    answer: document.getElementById('field_faq_answer').value.trim(),
    keywords: keywords,
    active: document.getElementById('field_faq_active').checked,
    order: parseInt(document.getElementById('field_faq_order').value) || 0
  };

  if (!obj.answer || !obj.keywords.length) {
    showToast('Preenche a resposta e pelo menos uma palavra-chave.', 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  let result;
  if (editId) {
    result = await db.from('chatbot_faq').update(obj).eq('id', editId);
  } else {
    result = await db.from('chatbot_faq').insert(obj);
  }

  if (result.error) {
    showToast('Erro: ' + result.error.message, 'error');
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
    return;
  }

  showToast(editId ? 'FAQ atualizada!' : 'FAQ criada!', 'success');
  closeModal();
  loadFaq();
}

async function deleteFaq(id) {
  if (!confirm('Tem certeza que queres apagar esta FAQ?')) return;
  const { error } = await db.from('chatbot_faq').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar: ' + error.message, 'error'); return; }
  showToast('FAQ apagada!', 'success');
  loadFaq();
}
