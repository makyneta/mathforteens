// ============================================
// Math For Teens — Mapa de Presença
// Mapa satélite: Portugal continental + ilhas
// Pins vermelhos nos distritos com alunos
// ============================================
let mapDb;
try {
  if (!window.supabase) throw new Error('Supabase library not loaded');
  if (!window.supabase.createClient) throw new Error('createClient not found');
  mapDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Supabase init error:', e);
}

const PT_MAINLAND_BOUNDS = [[36.85, -9.68], [42.2, -6.08]];
const PT_AZORES_BOUNDS   = [[36.8, -31.4], [39.85, -24.9]];
const PT_MADEIRA_BOUNDS  = [[32.5, -17.35], [33.2, -16.08]];

const SATELLITE_LAYER = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  opts: {
    maxZoom: 18,
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics e comunidade GIS'
  }
};

let ptGeoData = null;
let ptLookupByKey = {};
let ptPinned = [];
let ptMaps = [];

document.addEventListener('DOMContentLoaded', initPortugalMap);

async function initPortugalMap() {
  if (!window.L || !mapDb) return;
  if (!document.getElementById('ptMainlandMap')) return;

  try {
    const [geoRes, pinsRes] = await Promise.all([
      fetch('assets/js/portugal-districts.geojson').then(r => r.json()),
      mapDb.from('student_districts').select('district')
    ]);

    if (geoRes && Array.isArray(geoRes.features)) {
      ptGeoData = geoRes;
      buildDistrictLookup();
    }
    ptPinned = pinsRes.error ? [] : (pinsRes.data || []).map(r => r.district).filter(Boolean);

    buildMainlandMap();
    buildIslandMap('ptAzoresMap', DISTRICT_TYPES.azores, PT_AZORES_BOUNDS, 5);
    buildIslandMap('ptMadeiraMap', DISTRICT_TYPES.madeira, PT_MADEIRA_BOUNDS, 6);
    updatePinCount();
  } catch (err) {
    console.error('Erro ao carregar o mapa:', err);
  }
}

function buildDistrictLookup() {
  ptLookupByKey = {};
  PORTUGAL_DISTRICTS.forEach(d => { ptLookupByKey[d.key] = d; });
}

function createBaseMap(el, bounds, minZoom) {
  const map = L.map(el, {
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: true,
    minZoom: minZoom,
    maxBounds: bounds,
    maxBoundsViscosity: 0.6
  });
  map.zoomControl && map.zoomControl.setPosition('bottomright');
  L.control.attribution({ prefix: false, position: 'topleft' }).addTo(map);
  L.tileLayer(SATELLITE_LAYER.url, SATELLITE_LAYER.opts).addTo(map);
  map.fitBounds(bounds, { padding: [8, 8] });
  ptMaps.push(map);
  return map;
}

function districtStyle(pinned) {
  return {
    color: '#ffffff',
    weight: pinned ? 1.6 : 1.1,
    opacity: 0.95,
    fillColor: pinned ? '#0E8C8F' : '#ffffff',
    fillOpacity: pinned ? 0.3 : 0.08,
    dashArray: '4 3'
  };
}

function addDistrictLayer(map, districtsOfType) {
  if (!ptGeoData) return;
  const keys = districtsOfType.map(d => d.key);
  const features = ptGeoData.features.filter(f => keys.indexOf(f.properties.name) !== -1);

  L.geoJSON(features, {
    style: f => {
      const d = ptLookupByKey[f.properties.name];
      return districtStyle(d && ptPinned.indexOf(d.name) !== -1);
    },
    onEachFeature: (feature, layer) => {
      const d = ptLookupByKey[feature.properties.name];
      if (!d) return;
      layer.bindTooltip(d.name, {
        sticky: true,
        direction: 'top',
        offset: [0, -4],
        className: 'pt-district-tooltip'
      });
      layer.on('mouseover', () => layer.setStyle(districtStyle(true)));
      layer.on('mouseout', () => {
        layer.setStyle(districtStyle(ptPinned.indexOf(d.name) !== -1));
      });
    }
  }).addTo(map);
}

function addPins(map, districtsOfType) {
  districtsOfType.forEach(d => {
    if (ptPinned.indexOf(d.name) === -1) return;
    L.marker([d.coord[0], d.coord[1]], {
      icon: makePinIcon(),
      zIndexOffset: 500,
      title: d.name
    })
      .bindTooltip(d.name, { direction: 'top', offset: [0, -32], className: 'pt-pin-tooltip' })
      .addTo(map);
  });
}

function makePinIcon() {
  return L.divIcon({
    className: 'pt-pin-div',
    html:
      '<span class="pt-pin-pulse"></span>' +
      '<svg class="pt-pin-svg" width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">' +
        '<ellipse cx="13" cy="31.5" rx="6.2" ry="1.9" fill="rgba(0,0,0,0.35)"/>' +
        '<path d="M13 1.5C7.1 1.5 2.5 6.1 2.5 12.4c0 8.8 10.5 19.6 10.5 19.6s10.5-10.8 10.5-19.6C23.5 6.1 18.9 1.5 13 1.5z" ' +
          'fill="url(#ptPinGrad)" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"/>' +
        '<circle cx="13" cy="12.4" r="5" fill="#ffffff" opacity="0.97"/>' +
        '<circle cx="13" cy="12.4" r="2.1" fill="#e11d48" opacity="0.9"/>' +
        '<linearGradient id="ptPinGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ff4d6d"/>' +
          '<stop offset="0.5" stop-color="#e11d48"/>' +
          '<stop offset="1" stop-color="#9f1239"/>' +
        '</linearGradient>' +
      '</svg>',
    iconSize: [26, 34],
    iconAnchor: [13, 33],
    tooltipAnchor: [0, -31]
  });
}

function buildMainlandMap() {
  const el = document.getElementById('ptMainlandMap');
  if (!el) return;
  const map = createBaseMap(el, PT_MAINLAND_BOUNDS, 5);
  addDistrictLayer(map, DISTRICT_TYPES.main);
  addPins(map, DISTRICT_TYPES.main);
}

function buildIslandMap(containerId, districtsOfType, bounds, minZoom) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const map = createBaseMap(el, bounds, minZoom);
  addDistrictLayer(map, districtsOfType);
  addPins(map, districtsOfType);
}

function updatePinCount() {
  const el = document.getElementById('ptMapCount');
  if (!el) return;
  const total = PORTUGAL_DISTRICTS.length;
  el.textContent = ptPinned.length + ' de ' + total + ' distritos e ilhas com alunos';
}

window.addEventListener('load', () => {
  ptMaps.forEach(m => m.invalidateSize());
});
