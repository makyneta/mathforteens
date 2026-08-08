// ============================================
// CRM Math For Teens — Gestão de Aulas
// ============================================
let db;
try {
  if (!window.supabase) throw new Error('Supabase library not loaded');
  if (!window.supabase.createClient) throw new Error('createClient not found');
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Supabase init error:', e);
  const el = document.getElementById('loginError');
  el.textContent = 'Erro ao ligar ao servidor: ' + e.message;
  el.style.display = 'block';
}

// ── Estado ──
let currentUser = null;
let allStudents = [];
let allLessons = [];
let allTasks = [];
let allNotes = [];
let crmSubjects = [];
let crmGrades = [];
let activeTab = 'dashboard';
let lessonSearch = '';
let lessonStatusFilter = '';
let lessonStudentFilter = '';
let studentSearch = '';
let studentStatusFilter = '';
let taskFilter = 'all';
let agendaWeekStart = startOfWeek(new Date());
let drawerStudentId = null;
let editingEntity = null; // 'student' | 'lesson' | 'task'
let editingId = null;

const STATUS_LABELS = { agendada: 'Agendada', realizada: 'Realizada', falta: 'Falta', cancelada: 'Cancelada' };
const STATUS_BADGES = { agendada: 'info', realizada: 'success', falta: 'danger', cancelada: 'neutral' };
const STUDENT_STATUS = { ativo: 'Ativo', pausado: 'Pausado', ex_aluno: 'Ex-aluno' };
const STUDENT_STATUS_BADGES = { ativo: 'success', pausado: 'warning', ex_aluno: 'neutral' };
const SOURCES = { website: 'Website', recomendacao: 'Recomendação', instagram: 'Instagram', outro: 'Outro' };

// ── Helpers ──
function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function showToast(msg, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'admin-toast ' + (type || 'success');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '—';
  return Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // segunda = 0
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getStudent(id) {
  return allStudents.find(s => s.id === id);
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1);
}

function inFuture(iso) {
  return new Date(iso).getTime() > Date.now();
}

function dueText(task) {
  if (!task.due_date) return 'Sem data';
  const due = new Date(task.due_date + 'T00:00:00');
  const today = todayStart();
  if (isSameDay(due, today)) return 'Hoje';
  const diff = Math.round((due - today) / 86400000);
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  return formatDate(due);
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
  showApp();
});

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('crmApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
});

db.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    showApp();
  }
});

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('crmApp').style.display = 'flex';
  document.getElementById('crmEmail').textContent = currentUser.email;

  const email = currentUser.email || '';
  const name = email.split('@')[0];
  const initial = (name.charAt(0) || 'A').toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarUserName').textContent = name;
  document.getElementById('welcomeMessage').textContent = 'Bem-vindo, ' + name + '!';

  loadAll();
}

// ============================================
// NAVEGAÇÃO / SIDEBAR
// ============================================
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('crmApp').classList.toggle('sidebar-open');
});

function closeSidebar() {
  document.getElementById('crmApp').classList.remove('sidebar-open');
}

document.querySelectorAll('.admin-nav-link[data-tab]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    setTab(link.dataset.tab);
    closeSidebar();
  });
});

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.admin-nav-link[data-tab]').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');
  const titles = { dashboard: 'Dashboard', agenda: 'Agenda', lessons: 'Gestão de Aulas', students: 'Gestão de Alunos', tasks: 'Gestão de Tarefas' };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
}

// ============================================
// CARREGAMENTO
// ============================================
async function loadAll() {
  await loadSubjectsRef();
  await Promise.all([loadStudents(), loadLessons(), loadTasks()]);
  renderAll();
}

async function loadSubjectsRef() {
  const [subRes, grRes] = await Promise.all([
    db.from('subjects').select('*').order('display_order', { ascending: true }),
    db.from('subject_grades').select('*').order('display_order', { ascending: true })
  ]);
  if (!subRes.error) crmSubjects = subRes.data || [];
  if (!grRes.error) crmGrades = grRes.data || [];
}

async function loadStudents() {
  const { data, error } = await db.from('crm_students').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar alunos', 'error'); return; }
  allStudents = data || [];
}

async function loadLessons() {
  const { data, error } = await db.from('crm_lessons').select('*').order('starts_at', { ascending: false });
  if (error) { showToast('Erro ao carregar aulas', 'error'); return; }
  allLessons = data || [];
}

async function loadTasks() {
  const { data, error } = await db.from('crm_tasks').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar tarefas', 'error'); return; }
  allTasks = data || [];
}

function renderAll() {
  renderDashboard();
  renderAgenda();
  renderLessons();
  renderStudents();
  renderTasks();
  if (drawerStudentId) refreshDrawer(drawerStudentId);
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  const now = new Date();
  const month = monthKey(now);

  const activeStudents = allStudents.filter(s => s.status === 'ativo').length;
  const monthLessons = allLessons.filter(l => monthKey(new Date(l.starts_at)) === month);
  const monthRevenue = monthLessons
    .filter(l => l.paid && l.status !== 'cancelada')
    .reduce((acc, l) => acc + (Number(l.price) || 0), 0);
  const unpaid = allLessons.filter(l => !l.paid && l.status !== 'cancelada' && l.status !== 'falta');

  const stats = [
    { label: 'Alunos ativos', value: activeStudents, icon: 'primary', svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { label: 'Aulas este mês', value: monthLessons.length, icon: 'warning', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { label: 'Receita do mês', value: formatMoney(monthRevenue), icon: 'success', svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    { label: 'Pagamentos pendentes', value: unpaid.length, icon: 'info', svg: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' }
  ];

  document.getElementById('dashStats').innerHTML = stats.map(s => `
    <div class="admin-stat-card">
      <div class="admin-stat-header">
        <span class="admin-stat-label">${s.label}</span>
        <span class="admin-stat-icon ${s.icon}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${s.svg}</svg></span>
      </div>
      <div class="admin-stat-value">${esc(s.value)}</div>
    </div>`).join('');

  const todayLessons = allLessons
    .filter(l => isSameDay(new Date(l.starts_at), now) && l.status !== 'cancelada')
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  const upcomingLessons = allLessons
    .filter(l => l.status === 'agendada' && new Date(l.starts_at) > now)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 6);

  const unpaidSorted = unpaid
    .filter(l => new Date(l.starts_at) <= now)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 6);

  document.getElementById('dashTodayCount').textContent = todayLessons.length;
  document.getElementById('dashUpcomingCount').textContent = allLessons.filter(l => l.status === 'agendada' && new Date(l.starts_at) > now).length;
  document.getElementById('dashUnpaidCount').textContent = unpaid.length;

  document.getElementById('dashToday').innerHTML = todayLessons.length
    ? todayLessons.map(l => dashLessonItem(l)).join('')
    : '<div class="crm-dash-empty">Sem aulas para hoje. Bom descanso!</div>';

  document.getElementById('dashUpcoming').innerHTML = upcomingLessons.length
    ? upcomingLessons.map(l => dashLessonItem(l, true)).join('')
    : '<div class="crm-dash-empty">Sem próximas aulas agendadas.</div>';

  document.getElementById('dashUnpaid').innerHTML = unpaidSorted.length
    ? unpaidSorted.map(l => dashUnpaidItem(l)).join('')
    : '<div class="crm-dash-empty">Sem pagamentos pendentes em atraso.</div>';
}

function dashLessonItem(l, withDate) {
  const s = getStudent(l.student_id);
  return `
    <div class="crm-dash-item" onclick="openLessonModal('${l.id}')">
      <span class="crm-dash-time">${formatTime(l.starts_at)}</span>
      <div class="crm-dash-info">
        <strong>${esc(s ? s.name : 'Aluno removido')}</strong>
        <small>${esc(l.subject || 'Matemática')}${withDate ? ' · ' + formatDateShort(l.starts_at) : ''}</small>
      </div>
      <span class="crm-badge ${STATUS_BADGES[l.status] || 'neutral'}">${STATUS_LABELS[l.status] || esc(l.status)}</span>
    </div>`;
}

function dashUnpaidItem(l) {
  const s = getStudent(l.student_id);
  return `
    <div class="crm-dash-item">
      <span class="crm-dash-time danger">${formatDateShort(l.starts_at)}</span>
      <div class="crm-dash-info">
        <strong>${esc(s ? s.name : 'Aluno removido')}</strong>
        <small>${esc(l.subject || 'Matemática')} · ${formatMoney(l.price)}</small>
      </div>
      <button class="admin-action-btn" onclick="toggleLessonPaid('${l.id}', event)">Marcar pago</button>
    </div>`;
}

// ============================================
// AGENDA SEMANAL
// ============================================
function renderAgenda() {
  const monday = agendaWeekStart;
  const sunday = addDays(monday, 6);

  const title = document.getElementById('agendaWeekTitle');
  const fmt = (d) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
  if (monday.getMonth() === sunday.getMonth()) {
    title.textContent = fmt(monday) + ' — ' + fmt(sunday) + ' · ' + sunday.getFullYear();
  } else {
    title.textContent = fmt(monday) + ' — ' + fmt(sunday) + ' · ' + monday.getFullYear() + '/' + sunday.getFullYear();
  }

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const now = new Date();

  const board = document.getElementById('agendaBoard');
  let html = '';
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const dayLessons = allLessons
      .filter(l => isSameDay(new Date(l.starts_at), day))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const isToday = isSameDay(day, now);
    const isWeekend = i >= 5;

    html += `
      <div class="crm-agenda-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
        <div class="crm-agenda-day-head">
          <span class="day-name">${dayNames[i]}</span>
          <span class="day-num">${day.getDate()}</span>
        </div>
        <div class="crm-agenda-lessons">
          ${dayLessons.length
            ? dayLessons.map(l => {
                const s = getStudent(l.student_id);
                const cancelada = l.status === 'cancelada';
                const falta = l.status === 'falta';
                return `
                  <div class="crm-agenda-lesson ${cancelada ? 'cancelada' : ''} ${falta ? 'falta' : ''}" onclick="openLessonModal('${l.id}')">
                    <p>${formatTime(l.starts_at)}</p>
                    <strong>${esc(s ? s.name : 'Aluno removido')}</strong>
                    <small>${esc(l.subject || 'Matemática')}${l.topic ? ' · ' + esc(l.topic) : ''}${!l.paid && !cancelada ? ' · ⚠' : ''}</small>
                  </div>`;
              }).join('')
            : '<div class="crm-agenda-empty">Sem aulas</div>'}
        </div>
      </div>`;
  }
  board.innerHTML = html;
}

function shiftWeek(dir) {
  agendaWeekStart = addDays(agendaWeekStart, dir * 7);
  renderAgenda();
}

function goToCurrentWeek() {
  agendaWeekStart = startOfWeek(new Date());
  renderAgenda();
}

// ============================================
// AULAS
// ============================================
function onLessonFilter() {
  lessonSearch = document.getElementById('lessonSearch').value.toLowerCase();
  lessonStatusFilter = document.getElementById('lessonStatusFilter').value;
  lessonStudentFilter = document.getElementById('lessonStudentFilter').value;
  renderLessons();
}

function renderLessons() {
  const select = document.getElementById('lessonStudentFilter');
  const current = lessonStudentFilter;
  const options = allStudents
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  select.innerHTML = '<option value="">Todos os alunos</option>' + options;
  select.value = current;

  let list = allLessons.slice();
  if (lessonSearch) {
    list = list.filter(l => {
      const s = getStudent(l.student_id);
      const hay = ((s ? s.name : '') + ' ' + (l.subject || '') + ' ' + (l.topic || '')).toLowerCase();
      return hay.includes(lessonSearch);
    });
  }
  if (lessonStatusFilter) list = list.filter(l => l.status === lessonStatusFilter);
  if (lessonStudentFilter) list = list.filter(l => l.student_id === lessonStudentFilter);

  list.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

  const listEl = document.getElementById('lessonsList');
  const emptyEl = document.getElementById('lessonsEmpty');
  if (!list.length) {
    listEl.innerHTML = '';
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';
  listEl.innerHTML = list.map(lessonItemHtml).join('');
}

function lessonItemHtml(l) {
  const s = getStudent(l.student_id);
  const isPast = !inFuture(l.starts_at) && l.status === 'agendada';
  const payBadge = l.paid
    ? '<span class="crm-badge success">Pago</span>'
    : '<span class="crm-badge warning">Pendente</span>';
  return `
    <div class="crm-list-item" onclick="openLessonModal('${l.id}')">
      <div class="crm-list-main">
        <h4>
          ${esc(s ? s.name : 'Aluno removido')}
          <span class="crm-badge ${STATUS_BADGES[l.status] || 'neutral'}">${STATUS_LABELS[l.status] || esc(l.status)}</span>
          ${payBadge}
        </h4>
        <p>
          <span>${formatDate(l.starts_at)} · ${formatTime(l.starts_at)}</span>
          <span>${esc(l.subject || 'Matemática')}${l.grade ? ' · ' + esc(l.grade) + 'º ano' : ''}</span>
          ${l.topic ? '<span>' + esc(l.topic) + '</span>' : ''}
          <span>${formatMoney(l.price)}</span>
        </p>
      </div>
      <div class="crm-list-actions">
        ${isPast ? `<button class="admin-action-btn" onclick="setLessonStatus('${l.id}', 'realizada', event)">Concluir</button>` : ''}
        ${!l.paid && l.status !== 'cancelada' && l.status !== 'falta' ? `<button class="admin-action-btn" onclick="toggleLessonPaid('${l.id}', event)">Marcar pago</button>` : ''}
        <button class="admin-action-btn" onclick="openDrawer('${l.student_id || ''}', event)">Aluno</button>
        <button class="admin-action-btn danger" onclick="deleteLesson('${l.id}', event)">Apagar</button>
      </div>
    </div>`;
}

async function setLessonStatus(id, status, ev) {
  if (ev) ev.stopPropagation();
  const { error } = await db.from('crm_lessons').update({ status }).eq('id', id);
  if (error) { showToast('Erro ao atualizar aula', 'error'); return; }
  if (status === 'realizada') {
    await db.from('crm_lessons').update({ updated_at: new Date().toISOString() }).eq('id', id);
  }
  await loadLessons();
  renderAll();
  showToast('Aula ' + (STATUS_LABELS[status] || status).toLowerCase());
}

async function toggleLessonPaid(id, ev) {
  if (ev) ev.stopPropagation();
  const l = allLessons.find(x => x.id === id);
  if (!l) return;
  const paid = !l.paid;
  const patch = paid ? { paid: true, payment_date: new Date().toISOString() } : { paid: false, payment_date: null };
  const { error } = await db.from('crm_lessons').update(patch).eq('id', id);
  if (error) { showToast('Erro ao atualizar pagamento', 'error'); return; }
  await loadLessons();
  renderAll();
  showToast(paid ? 'Pagamento registado' : 'Pagamento marcado como pendente');
}

// ============================================
// ALUNOS
// ============================================
function onStudentFilter() {
  studentSearch = document.getElementById('studentSearch').value.toLowerCase();
  studentStatusFilter = document.getElementById('studentStatusFilter').value;
  renderStudents();
}

function renderStudents() {
  let list = allStudents.slice();
  if (studentSearch) {
    list = list.filter(s => (s.name + ' ' + (s.email || '') + ' ' + (s.phone || '')).toLowerCase().includes(studentSearch));
  }
  if (studentStatusFilter) list = list.filter(s => s.status === studentStatusFilter);

  list.sort((a, b) => a.name.localeCompare(b.name));

  const listEl = document.getElementById('studentsList');
  const emptyEl = document.getElementById('studentsEmpty');
  if (!list.length) {
    listEl.innerHTML = '';
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';
  listEl.innerHTML = list.map(s => {
    const lessonCount = allLessons.filter(l => l.student_id === s.id).length;
    const pending = allLessons.filter(l => l.student_id === s.id && !l.paid && l.status !== 'cancelada' && l.status !== 'falta').length;
    return `
      <div class="crm-list-item" onclick="openDrawer('${s.id}')">
        <div class="crm-list-main">
          <h4>
            <span class="crm-badge ${STUDENT_STATUS_BADGES[s.status] || 'neutral'}">${STUDENT_STATUS[s.status] || esc(s.status)}</span>
            ${esc(s.name)}
          </h4>
          <p>
            <span>${esc(s.subjects && s.subjects.length ? s.subjects.join(', ') : 'Sem disciplinas')}</span>
            ${s.grade ? '<span>' + esc(s.grade) + 'º ano</span>' : ''}
            <span>${lessonCount} aulas</span>
            ${pending ? `<span class="crm-badge warning">${pending} pago pendente</span>` : ''}
          </p>
        </div>
        <div class="crm-list-actions">
          <button class="admin-action-btn" onclick="openStudentModal('${s.id}', event)">Editar</button>
          <button class="admin-action-btn danger" onclick="deleteStudent('${s.id}', event)">Apagar</button>
        </div>
      </div>`;
  }).join('');
}

// ============================================
// TAREFAS
// ============================================
function setTaskFilter(f) {
  taskFilter = f;
  document.querySelectorAll('#taskTabs .admin-subtab').forEach(b => b.classList.toggle('active', b.dataset.f === f));
  renderTasks();
}

function renderTasks() {
  let list = allTasks.slice();
  const today = todayStart();

  if (taskFilter === 'pending') list = list.filter(t => !t.done);
  else if (taskFilter === 'overdue') list = list.filter(t => !t.done && t.due_date && new Date(t.due_date + 'T00:00:00') < today);
  else if (taskFilter === 'done') list = list.filter(t => t.done);

  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const listEl = document.getElementById('tasksList');
  const emptyEl = document.getElementById('tasksEmpty');
  if (!list.length) {
    listEl.innerHTML = '';
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';

  listEl.innerHTML = list.map(t => {
    const s = getStudent(t.student_id);
    const overdue = !t.done && t.due_date && new Date(t.due_date + 'T00:00:00') < today;
    return `
      <div class="crm-task-item ${t.done ? 'done' : ''}">
        <button class="crm-task-check ${t.done ? 'checked' : ''}" onclick="toggleTaskDone('${t.id}', event)" aria-label="Concluir tarefa">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <div class="crm-task-info">
          <h4>${esc(t.title)}</h4>
          <p>${s ? 'Aluno: ' + esc(s.name) : 'Sem aluno associado'}</p>
        </div>
        <span class="crm-task-due ${overdue ? 'overdue' : ''}">${dueText(t)}${overdue ? ' · Vencida' : ''}</span>
        <div class="crm-list-actions">
          <button class="admin-action-btn" onclick="openTaskModal('${t.id}', event)">Editar</button>
          <button class="admin-action-btn danger" onclick="deleteTask('${t.id}', event)">Apagar</button>
        </div>
      </div>`;
  }).join('');
}

async function toggleTaskDone(id, ev) {
  if (ev) ev.stopPropagation();
  const t = allTasks.find(x => x.id === id);
  if (!t) return;
  const done = !t.done;
  const patch = done ? { done: true, completed_at: new Date().toISOString() } : { done: false, completed_at: null };
  const { error } = await db.from('crm_tasks').update(patch).eq('id', id);
  if (error) { showToast('Erro ao atualizar tarefa', 'error'); return; }
  await loadTasks();
  renderTasks();
  showToast(done ? 'Tarefa concluída' : 'Tarefa reaberta');
}

// ============================================
// DRAWER — FICHA DO ALUNO
// ============================================
async function openDrawer(studentId, ev) {
  if (ev) ev.stopPropagation();
  if (!studentId) { showToast('Aluno não associado a esta aula', 'error'); return; }
  drawerStudentId = studentId;
  document.getElementById('drawerBackdrop').style.display = 'block';
  const drawer = document.getElementById('drawer');
  drawer.style.display = 'flex';
  drawer.setAttribute('aria-hidden', 'false');
  refreshDrawer(studentId);
}

function closeDrawer() {
  drawerStudentId = null;
  document.getElementById('drawerBackdrop').style.display = 'none';
  const drawer = document.getElementById('drawer');
  drawer.style.display = 'none';
  drawer.setAttribute('aria-hidden', 'true');
}

async function refreshDrawer(studentId) {
  const s = getStudent(studentId);
  if (!s) { closeDrawer(); return; }

  document.getElementById('drawerAvatar').textContent = initials(s.name);
  document.getElementById('drawerName').textContent = s.name;
  document.getElementById('drawerMeta').innerHTML =
    `${STUDENT_STATUS[s.status] || esc(s.status)} · ${esc(s.subjects && s.subjects.length ? s.subjects.join(', ') : 'Sem disciplinas')}`;

  const studentLessons = allLessons
    .filter(l => l.student_id === studentId)
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
  const upcoming = studentLessons.filter(l => l.status === 'agendada' && inFuture(l.starts_at)).slice(0, 5);
  const pendingPayment = studentLessons.filter(l => !l.paid && l.status !== 'cancelada' && l.status !== 'falta').length;
  const notes = allNotes.filter(n => n.student_id === studentId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const metaFields = [
    s.email ? `<div class="crm-drawer-field full"><strong>Email</strong><span>${esc(s.email)}</span></div>` : '',
    s.phone ? `<div class="crm-drawer-field full"><strong>Telemóvel</strong><span>${esc(s.phone)}</span></div>` : '',
    s.grade ? `<div class="crm-drawer-field"><strong>Ano</strong><span>${esc(s.grade)}º</span></div>` : '',
    s.school ? `<div class="crm-drawer-field"><strong>Escola</strong><span>${esc(s.school)}</span></div>` : '',
    s.source ? `<div class="crm-drawer-field"><strong>Origem</strong><span>${SOURCES[s.source] || esc(s.source)}</span></div>` : '',
    s.last_lesson_at ? `<div class="crm-drawer-field"><strong>Última aula</strong><span>${formatDate(s.last_lesson_at)}</span></div>` : ''
  ].join('');

  const body = `
    <div class="crm-drawer-section">
      <div class="crm-drawer-section-head">
        <h4>Detalhes</h4>
        <button class="admin-action-btn" onclick="openStudentModal('${s.id}')">Editar</button>
      </div>
      <div class="crm-drawer-section-body">
        <div class="crm-drawer-fields">
          ${metaFields || '<div class="crm-drawer-field full"><span>Sem informação adicional.</span></div>'}
          ${pendingPayment ? `<div class="crm-drawer-field full"><strong>Pagamentos pendentes</strong><span class="crm-badge warning">${pendingPayment}</span></div>` : ''}
          ${s.notes ? `<div class="crm-drawer-field full"><strong>Nota geral</strong><span>${esc(s.notes)}</span></div>` : ''}
        </div>
      </div>
    </div>

    <div class="crm-drawer-section">
      <div class="crm-drawer-section-head">
        <h4>Próximas aulas</h4>
        <button class="admin-action-btn" onclick="openLessonModal(null, '${s.id}')">+ Aula</button>
      </div>
      <div class="crm-drawer-section-body">
        ${upcoming.length
          ? upcoming.map(l => `
              <div class="crm-dash-item" onclick="openLessonModal('${l.id}')">
                <span class="crm-dash-time">${formatDateShort(l.starts_at)}</span>
                <div class="crm-dash-info">
                  <strong>${formatTime(l.starts_at)}</strong>
                  <small>${esc(l.subject || 'Matemática')}${l.topic ? ' · ' + esc(l.topic) : ''}</small>
                </div>
                ${l.paid ? '<span class="crm-badge success">Pago</span>' : '<span class="crm-badge warning">Pendente</span>'}
              </div>`).join('')
          : '<div class="crm-dash-empty">Sem próximas aulas agendadas.</div>'}
      </div>
    </div>

    <div class="crm-drawer-section">
      <div class="crm-drawer-section-head">
        <h4>Notas (${notes.length})</h4>
        <button class="admin-action-btn" onclick="addNotePrompt('${s.id}')">+ Nota</button>
      </div>
      <div class="crm-drawer-section-body">
        ${notes.length
          ? notes.map(n => `
              <div class="crm-drawer-note">
                <p>${esc(n.body)}</p>
                <small>${new Date(n.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
              </div>`).join('')
          : '<div class="crm-dash-empty">Sem notas registadas.</div>'}
      </div>
    </div>`;

  document.getElementById('drawerBody').innerHTML = body;
}

async function addNotePrompt(studentId) {
  const body = prompt('Nova nota para este aluno:');
  if (body === null || !body.trim()) return;
  const { error } = await db.from('crm_notes').insert({ student_id: studentId, body: body.trim() });
  if (error) { showToast('Erro ao guardar nota', 'error'); return; }
  await loadNotes(studentId);
  showToast('Nota adicionada');
}

async function loadNotes(studentId) {
  const { data, error } = await db.from('crm_notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) return;
  allNotes = allNotes.filter(n => n.student_id !== studentId).concat(data || []);
  refreshDrawer(studentId);
}

// ============================================
// MODAL
// ============================================
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingEntity = null;
  editingId = null;
}

function fieldRowHtml(label, inner) {
  return `<div class="admin-field"><label>${label}</label>${inner}</div>`;
}

function textField(id, label, value, placeholder, type) {
  return fieldRowHtml(label, `<input type="${type || 'text'}" id="${id}" value="${esc(value || '')}" placeholder="${esc(placeholder || '')}">`);
}

function textareaField(id, label, value, placeholder) {
  return fieldRowHtml(label, `<textarea id="${id}" rows="3" placeholder="${esc(placeholder || '')}">${esc(value || '')}</textarea>`);
}

function selectField(id, label, options, value) {
  const opts = options.map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  return fieldRowHtml(label, `<select id="${id}">${opts}</select>`);
}

function subjectOptions(value) {
  const subs = crmSubjects.length ? crmSubjects : [{ id: '', name: 'Matemática' }];
  return subs.map(s => `<option value="${esc(s.name)}" ${s.name === value ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

function gradeOptions(subject, value) {
  const s = crmSubjects.find(x => x.name === subject);
  const grades = s ? crmGrades.filter(g => g.subject_id === s.id).map(g => g.grade) : [];
  if (!grades.length) grades.push('', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  return grades.map(g => `<option value="${esc(g)}" ${String(g) === String(value) ? 'selected' : ''}>${g ? esc(g) + 'º ano' : 'Sem ano'}</option>`).join('');
}

// ── Formulário: Aula ──
async function openLessonModal(id, presetStudentId, ev) {
  if (ev) ev.stopPropagation();
  let data = null;
  if (id) {
    data = allLessons.find(l => l.id === id);
    if (!data) return;
  }

  editingEntity = 'lesson';
  editingId = id || null;

  const studentOptionsHtml = allStudents
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(s => `<option value="${s.id}" ${s.id === (data ? data.student_id : presetStudentId) ? 'selected' : ''}>${esc(s.name)}</option>`)
    .join('');

  const startsAt = data ? new Date(data.starts_at) : new Date();
  if (!data) startsAt.setMinutes(0, 0, 0);
  const dateVal = toLocalInput(startsAt);
  const timeVal = toLocalTimeInput(startsAt);
  const subject = data ? data.subject : (crmSubjects.length ? crmSubjects[0].name : 'Matemática');

  document.getElementById('modalTitle').textContent = data ? 'Editar Aula' : 'Adicionar Aula';
  const form = document.getElementById('modalForm');
  form.innerHTML =
    selectField('field_student_id', 'Aluno', [{ value: '', label: 'Seleciona um aluno...' }].concat(allStudents.map(s => ({ value: s.id, label: s.name }))), data ? data.student_id : presetStudentId || '') +
    fieldRowHtml('Disciplina', `<select id="field_subject" onchange="syncGradeOptions()">${subjectOptions(subject)}</select>`) +
    fieldRowHtml('Ano', `<select id="field_grade">${gradeOptions(subject, data ? data.grade : '')}</select>`) +
    textField('field_topic', 'Tema da aula', data ? data.topic : '', 'Ex.: Equações do 1º grau') +
    `<div class="crm-field-row">
      ${fieldRowHtml('Data', `<input type="date" id="field_date" value="${dateVal}" required>`)}
      ${fieldRowHtml('Hora', `<input type="time" id="field_time" value="${timeVal}" required>`)}
    </div>` +
    `<div class="crm-field-row">
      ${textField('field_duration', 'Duração (min)', data ? data.duration_min : 60, '60')}
      ${textField('field_price', 'Preço (€)', data ? data.price : '', '25,00', 'number')}
    </div>` +
    selectField('field_status', 'Estado', Object.keys(STATUS_LABELS).map(k => ({ value: k, label: STATUS_LABELS[k] })), data ? data.status : 'agendada') +
    fieldRowHtml('Pagamento', `
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:4px;">
        <input type="checkbox" id="field_paid" ${data && data.paid ? 'checked' : ''}> Aula paga
      </label>`) +
    textareaField('field_lesson_notes', 'Observações', data ? data.notes : '', 'Notas sobre a aula...') +
    `<div class="admin-modal-footer">
      ${data ? `<button type="button" class="btn btn-secondary" onclick="deleteLesson('${data.id}')">Apagar</button>` : ''}
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  form.onsubmit = saveLessonForm;
  document.getElementById('modal').style.display = 'flex';
}

function syncGradeOptions() {
  const subject = document.getElementById('field_subject').value;
  document.getElementById('field_grade').innerHTML = gradeOptions(subject, '');
}

function toLocalInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalTimeInput(d) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

async function saveLessonForm(e) {
  e.preventDefault();
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const studentId = document.getElementById('field_student_id').value;
  if (!studentId) { showToast('Seleciona um aluno', 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  const dateVal = document.getElementById('field_date').value;
  const timeVal = document.getElementById('field_time').value || '00:00';
  const startsAt = new Date(dateVal + 'T' + timeVal + ':00');
  if (isNaN(startsAt.getTime())) { showToast('Data inválida', 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  const obj = {
    student_id: studentId,
    subject: document.getElementById('field_subject').value,
    grade: document.getElementById('field_grade').value || null,
    topic: document.getElementById('field_topic').value,
    starts_at: startsAt.toISOString(),
    duration_min: parseInt(document.getElementById('field_duration').value) || 60,
    price: document.getElementById('field_price').value !== '' ? parseFloat(document.getElementById('field_price').value.replace(',', '.')) : null,
    status: document.getElementById('field_status').value,
    paid: document.getElementById('field_paid').checked,
    notes: document.getElementById('field_lesson_notes').value
  };
  if (obj.paid && !(allLessons.find(l => l.id === editingId) || {}).paid) {
    obj.payment_date = new Date().toISOString();
  }
  if (!obj.paid) obj.payment_date = null;

  let result;
  if (editingId) {
    result = await db.from('crm_lessons').update(obj).eq('id', editingId);
  } else {
    result = await db.from('crm_lessons').insert(obj);
  }

  if (result.error) { showToast('Erro ao guardar aula: ' + result.error.message, 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  const student = getStudent(studentId);
  if (obj.status === 'realizada' && student && student.last_lesson_at !== startsAt.toISOString()) {
    await db.from('crm_students').update({ last_lesson_at: startsAt.toISOString() }).eq('id', studentId);
  }

  closeModal();
  await loadStudents();
  await loadLessons();
  renderAll();
  showToast('Aula guardada');
}

// ── Formulário: Aluno ──
async function openStudentModal(id, ev) {
  if (ev) ev.stopPropagation();
  let data = null;
  if (id) data = getStudent(id);

  editingEntity = 'student';
  editingId = id || null;

  const subjectChips = crmSubjects.length ? crmSubjects : [{ name: 'Matemática' }, { name: 'Física' }, { name: 'Química' }, { name: 'Biologia' }];
  const chosen = data ? (data.subjects || []) : [];

  document.getElementById('modalTitle').textContent = data ? 'Editar Aluno' : 'Adicionar Aluno';
  const form = document.getElementById('modalForm');
  form.innerHTML =
    textField('field_student_name', 'Nome *', data ? data.name : '', 'Nome completo') +
    `<div class="crm-field-row">
      ${textField('field_student_email', 'Email', data ? data.email : '', 'email@exemplo.com', 'email')}
      ${textField('field_student_phone', 'Telemóvel', data ? data.phone : '', '912 345 678', 'tel')}
    </div>` +
    `<div class="crm-field-row">
      ${textField('field_student_grade', 'Ano', data ? data.grade : '', 'Ex.: 9')}
      ${textField('field_student_school', 'Escola', data ? data.school : '', 'Escola')}
    </div>` +
    fieldRowHtml('Disciplinas', `
      <div id="subjectChips" class="crm-chips">
        ${subjectChips.map(s => `
          <label class="crm-chip">
            <input type="checkbox" value="${esc(s.name)}" ${chosen.includes(s.name) ? 'checked' : ''}>
            <span>${esc(s.name)}</span>
          </label>`).join('')}
      </div>`) +
    selectField('field_student_status', 'Estado', Object.keys(STUDENT_STATUS).map(k => ({ value: k, label: STUDENT_STATUS[k] })), data ? data.status : 'ativo') +
    selectField('field_student_source', 'Origem', Object.keys(SOURCES).map(k => ({ value: k, label: SOURCES[k] })), data ? data.source : 'website') +
    textareaField('field_student_notes', 'Nota geral', data ? data.notes : '', 'Informação relevante sobre o aluno...') +
    `<div class="admin-modal-footer">
      ${data ? `<button type="button" class="btn btn-secondary" onclick="deleteStudent('${data.id}')">Apagar</button>` : ''}
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  form.onsubmit = saveStudentForm;
  document.getElementById('modal').style.display = 'flex';
}

async function saveStudentForm(e) {
  e.preventDefault();
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const name = document.getElementById('field_student_name').value.trim();
  if (!name) { showToast('O nome é obrigatório', 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  const subjects = Array.from(document.querySelectorAll('#subjectChips input:checked')).map(i => i.value);

  const obj = {
    name,
    email: document.getElementById('field_student_email').value,
    phone: document.getElementById('field_student_phone').value,
    grade: document.getElementById('field_student_grade').value,
    school: document.getElementById('field_student_school').value,
    subjects,
    status: document.getElementById('field_student_status').value,
    source: document.getElementById('field_student_source').value,
    notes: document.getElementById('field_student_notes').value
  };

  let result;
  if (editingId) {
    result = await db.from('crm_students').update(obj).eq('id', editingId);
  } else {
    obj.consent = true;
    result = await db.from('crm_students').insert(obj);
  }

  if (result.error) { showToast('Erro ao guardar aluno: ' + result.error.message, 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  closeModal();
  await loadStudents();
  renderStudents();
  renderDashboard();
  showToast('Aluno guardado');
}

// ── Formulário: Tarefa ──
async function openTaskModal(id, ev) {
  if (ev) ev.stopPropagation();
  let data = null;
  if (id) data = allTasks.find(t => t.id === id);

  editingEntity = 'task';
  editingId = id || null;

  document.getElementById('modalTitle').textContent = data ? 'Editar Tarefa' : 'Adicionar Tarefa';
  const form = document.getElementById('modalForm');
  form.innerHTML =
    textField('field_task_title', 'Título *', data ? data.title : '', 'Ex.: Relembrar renovação de aulas') +
    selectField('field_task_student', 'Aluno', [{ value: '', label: 'Sem aluno associado' }].concat(allStudents.map(s => ({ value: s.id, label: s.name }))), data ? data.student_id || '' : '') +
    textField('field_task_due', 'Data limite', data ? data.due_date || '' : toLocalInput(new Date()), '', 'date') +
    `<div class="admin-modal-footer">
      ${data ? `<button type="button" class="btn btn-secondary" onclick="deleteTask('${data.id}')">Apagar</button>` : ''}
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Guardar</button>
    </div>`;

  form.onsubmit = saveTaskForm;
  document.getElementById('modal').style.display = 'flex';
}

async function saveTaskForm(e) {
  e.preventDefault();
  const btn = document.getElementById('modalSubmitBtn');
  btn.innerHTML = '<span class="admin-spinner"></span>';
  btn.disabled = true;

  const title = document.getElementById('field_task_title').value.trim();
  if (!title) { showToast('O título é obrigatório', 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  const studentId = document.getElementById('field_task_student').value || null;
  const due = document.getElementById('field_task_due').value || null;

  const obj = { title, student_id: studentId, due_date: due };

  let result;
  if (editingId) {
    result = await db.from('crm_tasks').update(obj).eq('id', editingId);
  } else {
    result = await db.from('crm_tasks').insert(obj);
  }

  if (result.error) { showToast('Erro ao guardar tarefa: ' + result.error.message, 'error'); btn.innerHTML = 'Guardar'; btn.disabled = false; return; }

  closeModal();
  await loadTasks();
  renderTasks();
  showToast('Tarefa guardada');
}

// ============================================
// ELIMINAR
// ============================================
async function deleteLesson(id, ev) {
  if (ev) ev.stopPropagation();
  if (!confirm('Apagar esta aula?')) return;
  const { error } = await db.from('crm_lessons').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar aula', 'error'); return; }
  closeModal();
  await loadLessons();
  renderAll();
  showToast('Aula apagada');
}

async function deleteStudent(id, ev) {
  if (ev) ev.stopPropagation();
  if (!confirm('Apagar este aluno? As aulas, tarefas e notas associadas também serão apagadas.')) return;
  const { error } = await db.from('crm_students').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar aluno', 'error'); return; }
  closeModal();
  closeDrawer();
  await Promise.all([loadStudents(), loadLessons(), loadTasks()]);
  renderAll();
  showToast('Aluno apagado');
}

async function deleteTask(id, ev) {
  if (ev) ev.stopPropagation();
  if (!confirm('Apagar esta tarefa?')) return;
  const { error } = await db.from('crm_tasks').delete().eq('id', id);
  if (error) { showToast('Erro ao apagar tarefa', 'error'); return; }
  closeModal();
  await loadTasks();
  renderTasks();
  showToast('Tarefa apagada');
}

// Tecla ESC fecha modal e drawer
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
  }
});
