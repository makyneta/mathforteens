// ============================================
// Math For Teens — Distritos de Portugal
// Zonas onde já houve alunos (mapa de presença)
// ============================================
// `key`   -> nome usado no GeoJSON (assets/js/portugal-districts.geojson)
// `name`  -> nome guardado na base de dados (student_districts.district)
// `type`  -> main | azores | madeira
// `label` -> Distrito | Região (mostrado no admin)
// `coord` -> [latitude, longitude] para o pin (centroide da maior ilha/distrito)

const PORTUGAL_DISTRICTS = [
  { key: 'AVEIRO',           name: 'Aveiro',           type: 'main',   label: 'Distrito', coord: [40.72369, -8.46831] },
  { key: 'BEJA',             name: 'Beja',             type: 'main',   label: 'Distrito', coord: [37.82965, -7.94398] },
  { key: 'BRAGA',            name: 'Braga',            type: 'main',   label: 'Distrito', coord: [41.55290, -8.30985] },
  { key: 'BRAGANÇA',         name: 'Bragança',         type: 'main',   label: 'Distrito', coord: [41.50937, -6.85934] },
  { key: 'CASTELO BRANCO',   name: 'Castelo Branco',   type: 'main',   label: 'Distrito', coord: [39.94653, -7.50148] },
  { key: 'COIMBRA',          name: 'Coimbra',          type: 'main',   label: 'Distrito', coord: [40.20444, -8.33594] },
  { key: 'ÉVORA',            name: 'Évora',            type: 'main',   label: 'Distrito', coord: [38.60385, -7.84166] },
  { key: 'FARO',             name: 'Faro',             type: 'main',   label: 'Distrito', coord: [37.24368, -8.13148] },
  { key: 'GUARDA',           name: 'Guarda',           type: 'main',   label: 'Distrito', coord: [40.64078, -7.22919] },
  { key: 'LEIRIA',           name: 'Leiria',           type: 'main',   label: 'Distrito', coord: [39.71746, -8.77480] },
  { key: 'LISBOA',           name: 'Lisboa',           type: 'main',   label: 'Distrito', coord: [38.99672, -9.16363] },
  { key: 'PORTALEGRE',       name: 'Portalegre',       type: 'main',   label: 'Distrito', coord: [39.19006, -7.62041] },
  { key: 'PORTO',            name: 'Porto',            type: 'main',   label: 'Distrito', coord: [41.22479, -8.35270] },
  { key: 'SANTARÉM',         name: 'Santarém',         type: 'main',   label: 'Distrito', coord: [39.29360, -8.47745] },
  { key: 'SETÚBAL',          name: 'Setúbal',          type: 'main',   label: 'Distrito', coord: [38.31880, -8.65303] },
  { key: 'VIANA DO CASTELO', name: 'Viana do Castelo', type: 'main',   label: 'Distrito', coord: [41.87775, -8.50720] },
  { key: 'VILA REAL',        name: 'Vila Real',        type: 'main',   label: 'Distrito', coord: [41.55504, -7.63170] },
  { key: 'VISEU',            name: 'Viseu',            type: 'main',   label: 'Distrito', coord: [40.79916, -7.86967] },
  { key: 'Região Autónoma dos Açores',   name: 'Açores',   type: 'azores',  label: 'Região', coord: [37.79627, -25.48141] },
  { key: 'Região Autónoma da Madeira',   name: 'Madeira',  type: 'madeira', label: 'Região', coord: [32.74657, -16.99931] }
];

const DISTRICT_TYPES = {
  main:   PORTUGAL_DISTRICTS.filter(d => d.type === 'main'),
  azores: PORTUGAL_DISTRICTS.filter(d => d.type === 'azores'),
  madeira: PORTUGAL_DISTRICTS.filter(d => d.type === 'madeira')
};

function getDistrictByName(name) {
  return PORTUGAL_DISTRICTS.find(d => d.name === name);
}

function getDistrictNameByKey(key) {
  const d = PORTUGAL_DISTRICTS.find(x => x.key === key);
  return d ? d.name : key;
}
