// ============================================
// Math For Teens — Mapa de Presença
// Conselhos/concelhos onde já houve alunos
// Lista agrupada por distrito (página Sobre)
// ============================================
let municipalitiesDb;
try {
  if (!window.supabase) throw new Error('Supabase library not loaded');
  if (!window.supabase.createClient) throw new Error('createClient not found');
  municipalitiesDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Supabase init error:', e);
}

document.addEventListener('DOMContentLoaded', initMunicipalitiesSection);

async function initMunicipalitiesSection() {
  if (!municipalitiesDb) return;
  const section = document.getElementById('municipalitiesSection');
  if (!section) return;

  const { data, error } = await municipalitiesDb.from('student_municipalities')
    .select('*')
    .order('district', { ascending: true })
    .order('municipality', { ascending: true });
  if (error) { console.error('Erro ao carregar conselhos:', error); return; }
  if (!data || !data.length) return;

  section.style.display = 'block';

  const countEl = document.getElementById('municipalitiesCount');
  if (countEl) countEl.textContent = data.length + ' conselho' + (data.length !== 1 ? 's' : '') + ' com alunos';

  const groups = {};
  data.forEach(m => {
    const d = m.district || 'Outro';
    (groups[d] = groups[d] || []).push(m.municipality);
  });

  const list = document.getElementById('municipalitiesList');
  if (!list) return;
  list.innerHTML = Object.keys(groups).map(district => {
    const chips = groups[district].map(name =>
      '<span class="pt-municipality-chip">' + escMunicipality(name) + '</span>'
    ).join('');
    return `
      <div class="pt-municipality-group">
        <div class="pt-municipality-district">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escMunicipality(district)}
        </div>
        <div class="pt-municipality-chips">${chips}</div>
      </div>`;
  }).join('');
}

function escMunicipality(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
