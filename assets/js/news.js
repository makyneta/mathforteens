let newsDb;
try {
  if (!window.supabase) throw new Error('Supabase library not loaded');
  if (!window.supabase.createClient) throw new Error('createClient not found');
  newsDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.error('Supabase init error:', e);
}

document.addEventListener('DOMContentLoaded', () => {
  initNewsSection();
});

async function initNewsSection() {
  if (!newsDb) return;
  const { data, error } = await newsDb.from('news').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Erro ao carregar notícias:', error); return; }
  if (!data || !data.length) return;

  const latest = data.slice(0, 3);
  renderNewsGrid(latest, 'newsGrid');
  if (data.length > 3) {
    document.getElementById('viewAllNewsBtn').style.display = 'inline-flex';
    document.getElementById('viewAllNewsBtn').onclick = () => openAllNewsModal(data);
  }
}

function renderNewsGrid(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items.length) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'grid';
  if (items.length === 1) {
    container.style.gridTemplateColumns = '1fr';
    container.style.maxWidth = '600px';
    container.style.margin = '0 auto';
  } else if (items.length === 2) {
    container.style.gridTemplateColumns = '1fr 1fr';
  } else {
    container.style.gridTemplateColumns = '';
    container.style.maxWidth = '';
    container.style.margin = '';
  }
  container.innerHTML = items.map(n => {
    const date = n.created_at ? new Date(n.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const preview = n.content ? n.content.substring(0, 120) + (n.content.length > 120 ? '...' : '') : '';
    return `<article class="news-card" onclick="openNewsDetail('${n.id}')">
      ${n.image_url ? `<div class="news-card-image"><img src="${escNews(n.image_url)}" alt="${escNews(n.title)}" loading="lazy" onerror="this.parentElement.classList.add('news-card-image-fallback')"></div>` : ''}
      <div class="news-card-body">
        <time class="news-card-date">${escNews(date)}</time>
        <h3 class="news-card-title">${escNews(n.title)}</h3>
        <p class="news-card-text">${escNews(preview)}</p>
        <span class="news-card-link">Ler mais</span>
      </div>
    </article>`;
  }).join('');
}

function openAllNewsModal(items) {
  document.getElementById('allNewsModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const grid = document.getElementById('allNewsGrid');
  const empty = document.getElementById('allNewsEmpty');
  if (!items || !items.length) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '';
  grid.style.maxWidth = '';
  grid.style.margin = '';
  grid.innerHTML = items.map(n => {
    const date = n.created_at ? new Date(n.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const preview = n.content ? n.content.substring(0, 120) + (n.content.length > 120 ? '...' : '') : '';
    return `<article class="news-card" onclick="openNewsDetail('${n.id}')">
      ${n.image_url ? `<div class="news-card-image"><img src="${escNews(n.image_url)}" alt="${escNews(n.title)}" loading="lazy" onerror="this.parentElement.classList.add('news-card-image-fallback')"></div>` : ''}
      <div class="news-card-body">
        <time class="news-card-date">${escNews(date)}</time>
        <h3 class="news-card-title">${escNews(n.title)}</h3>
        <p class="news-card-text">${escNews(preview)}</p>
        <span class="news-card-link">Ler mais</span>
      </div>
    </article>`;
  }).join('');
}

function closeAllNewsModal() {
  document.getElementById('allNewsModal').style.display = 'none';
  document.body.style.overflow = '';
}

async function openNewsDetail(id) {
  if (!newsDb) return;
  const { data, error } = await newsDb.from('news').select('*').eq('id', id).single();
  if (error || !data) { console.error('Erro ao carregar notícia:', error); return; }

  const n = data;
  const date = n.created_at ? new Date(n.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  document.getElementById('newsDetailTitle').textContent = n.title;
  document.getElementById('newsDetailBody').innerHTML = `
    ${n.image_url ? `<div class="news-detail-image"><img src="${escNews(n.image_url)}" alt="${escNews(n.title)}" onerror="this.style.display='none'"></div>` : ''}
    <time class="news-detail-date">${escNews(date)}</time>
    <div class="news-detail-content">${n.content.replace(/\n/g, '<br>')}</div>`;

  document.getElementById('newsDetailModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeNewsDetail() {
  document.getElementById('newsDetailModal').style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllNewsModal();
    closeNewsDetail();
  }
});

function escNews(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
