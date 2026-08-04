// ============================================
// Math For Teens — Renderizador de mapa "desenho à mão"
// Converte o GeoJSON de distritos num mapa ilustrado:
// fundo papel, traço a lápis/tinta, wash de cor e etiquetas.
// Sem tiles externos: devolve um <canvas> usado como overlay.
// ============================================

(function () {
  'use strict';

  const PAPER = '#f8f1df';
  const INK_BASE = 'rgba(26,56,64,';
  const TEAL_BASE = 'rgba(14,140,143,';

  function makeRng(seed) {
    let s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // Ruído pseudo-aleatório determinístico em [-1, 1]
  function noise2(seed, i) {
    const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  }

  function mercY(latDeg) {
    const lat = (latDeg * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + lat / 2));
  }

  function ringsForFeature(feature) {
    const g = feature.geometry;
    const out = [];
    if (g.type === 'Polygon') {
      out.push.apply(out, g.coordinates);
    } else if (g.type === 'MultiPolygon') {
      g.coordinates.forEach(function (poly) { out.push.apply(out, poly); });
    }
    return out;
  }

  function bboxDiag(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    return Math.sqrt((maxX - minX) * (maxX - minX) + (maxY - minY) * (maxY - minY));
  }

  // Traço "à mão": desenha o contorno com pequenos desvios por ponto,
  // em várias passagens (lápis grosso esbatido + linha de tinta).
  function strokeRing(ctx, pts, amp, seed, lineWidth, color) {
    const fo = [noise2(seed, 0) * amp, noise2(seed, 1) * amp];
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 1) {
      let ox, oy;
      if (i === pts.length - 1) { ox = fo[0]; oy = fo[1]; }
      else { ox = noise2(seed, i * 2) * amp; oy = noise2(seed, i * 2 + 1) * amp; }
      const x = pts[i][0] + ox;
      const y = pts[i][1] + oy;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  }

  function drawHandOutline(ctx, pts) {
    strokeRing(ctx, pts, 1.6, 21, 4.2, INK_BASE + '0.10)');
    strokeRing(ctx, pts, 1.1, 47, 2.6, INK_BASE + '0.45)');
    strokeRing(ctx, pts, 0.5, 83, 1.3, INK_BASE + '0.9)');
  }

  function paperTexture(ctx, w, h) {
    const rng = makeRng(999);
    ctx.save();
    ctx.fillStyle = '#8a7a52';
    ctx.globalAlpha = 0.04;
    const dots = Math.round((w * h) / 1600);
    for (let i = 0; i < dots; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      const r = rng() * 1.1 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(92,70,30,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawGraticule(ctx, bounds, project, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#7a6a4a';
    ctx.lineWidth = 1;
    for (let lon = Math.ceil(bounds.west); lon <= bounds.east; lon += 1) {
      const x = project(lon, (bounds.north + bounds.south) / 2)[0];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = Math.ceil(bounds.south); lat <= bounds.north; lat += 1) {
      const y = project((bounds.west + bounds.east) / 2, lat)[1];
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCompass(ctx, x, y, r, fontFamily) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = INK_BASE + '0.5)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0E8C8F';
    ctx.beginPath();
    ctx.moveTo(0, -r - 4);
    ctx.lineTo(-4, -6);
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INK_BASE + '0.55)';
    ctx.beginPath();
    ctx.moveTo(0, r + 4);
    ctx.lineTo(-4, 6);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 ' + Math.round(r * 0.6) + 'px ' + fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0B6E71';
    ctx.fillText('N', 0, -r - 14);
    ctx.restore();
  }

  function drawSketchFrame(ctx, w, h) {
    const pad = Math.max(10, w * 0.008);
    const pts = [[pad, pad], [w - pad, pad], [w - pad, h - pad], [pad, h - pad]];
    const passes = [[3, INK_BASE + '0.06)'], [1.3, INK_BASE + '0.3)']];
    passes.forEach(function (pass, p) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 1) {
        const ox = noise2(60 + p, i * 2) * 2.4;
        const oy = noise2(60 + p, i * 2 + 1) * 2.4;
        const x = pts[i][0] + ox;
        const y = pts[i][1] + oy;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineJoin = 'round';
      ctx.lineWidth = pass[0];
      ctx.strokeStyle = pass[1];
      ctx.stroke();
      ctx.restore();
    });
  }

  // Label do distrito com fonte manuscrita + contorno "recorte" de papel
  function drawDistrictLabel(ctx, ringPts, name, pinned, rng, fontFamily, width) {
    const diag = bboxDiag(ringPts);
    const base = Math.round(width * (pinned ? 0.020 : 0.016));
    const size = Math.max(15, Math.min(base, Math.max(16, diag * 0.85)));
    let sx = 0, sy = 0;
    ringPts.forEach(function (p) { sx += p[0]; sy += p[1]; });
    const cx = sx / ringPts.length;
    const cy = sy / ringPts.length;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rng() - 0.5) * 0.12);
    ctx.font = (pinned ? 700 : 600) + ' ' + size + 'px ' + fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2.5, size * 0.18);
    ctx.strokeStyle = 'rgba(248,241,223,0.95)';
    ctx.lineJoin = 'round';
    ctx.strokeText(name, 0, 0);
    ctx.fillStyle = pinned ? '#0B6E71' : INK_BASE + '0.85)';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // Decora as margens de papel quando o território não ocupa a largura toda
  function drawMarginDeco(ctx, renderables, width, height, fontFamily) {
    let minX = Infinity, maxX = -Infinity;
    renderables.forEach(function (r) {
      r.flat.forEach(function (p) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
      });
    });
    if (minX === Infinity) return;
    const leftM = minX;
    const rightM = width - maxX;
    const rng = makeRng(4242);

    if (leftM > width * 0.12) {
      ctx.save();
      ctx.translate(leftM / 2, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '700 ' + Math.round(width * 0.055) + 'px ' + fontFamily;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = INK_BASE + '1)';
      ctx.fillText('PORTUGAL', 0, 0);
      ctx.restore();
    }

    if (rightM > width * 0.10) {
      const doodles = ['\u03c0', '\u221ax', 'x\u00b2', '\u2211', '+', '\u221e'];
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = INK_BASE + '1)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      doodles.forEach(function (t) {
        const x = maxX + rightM * 0.1 + rng() * (rightM * 0.8);
        const y = rng() * height;
        const size = width * (0.03 + rng() * 0.03);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rng() - 0.5) * 0.4);
        ctx.font = '700 ' + Math.round(size) + 'px ' + fontFamily;
        ctx.fillText(t, 0, 0);
        ctx.restore();
      });
      ctx.restore();
    }
  }

  // ============================================================
  // API principal
  // renderDrawnMap(geoData, districts, pinnedNames, opts)
  //   opts.bounds     -> { north, south, west, east }
  //   opts.width      -> largura do canvas em px
  //   opts.padding    -> fração de margem em torno do território
  //   opts.fontFamily -> família para os rótulos
  //   opts.deco       -> desenhar bússola (continente)
  // Devolve um <canvas> pronto a usar.
  // ============================================================
  function renderDrawnMap(geoData, districts, pinnedNames, opts) {
    const bounds = opts.bounds;
    const width = opts.width || 2200;
    const padding = opts.padding != null ? opts.padding : 0.035;
    const fontFamily = opts.fontFamily || "'Caveat', 'Comic Sans MS', cursive";
    const toRad = Math.PI / 180;

    const minX = bounds.west * toRad;
    const maxX = bounds.east * toRad;
    const minY = mercY(bounds.south);
    const maxY = mercY(bounds.north);
    const scale = (width * (1 - 2 * padding)) / (maxX - minX);
    const height = Math.round((maxY - minY) * scale / (1 - 2 * padding));
    const offX = width * padding;
    const offY = height * padding;

    const project = function (lng, lat) {
      return [offX + (lng * toRad - minX) * scale, offY + (maxY - mercY(lat)) * scale];
    };

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Papel
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    paperTexture(ctx, width, height);

    if (opts.deco !== false) {
      drawGraticule(ctx, bounds, project, width, height);
    }

    // Prepara polígonos por distrito
    const byKey = {};
    districts.forEach(function (d) { byKey[d.key] = d; });
    const renderables = [];
    geoData.features.forEach(function (f) {
      const d = byKey[f.properties.name];
      if (!d) return;
      const pinned = pinnedNames.indexOf(d.name) !== -1;
      const rings = ringsForFeature(f).map(function (ring) {
        return ring.map(function (pt) { return project(pt[0], pt[1]); });
      });
      const flat = [];
      rings.forEach(function (ring) { flat.push.apply(flat, ring); });
      renderables.push({ d: d, pinned: pinned, rings: rings, flat: flat });
    });

    // Wash de cor (distritos com alunos a teal; restantes "papel mais claro")
    renderables.forEach(function (r) {
      const fill = r.pinned ? TEAL_BASE + '0.30)' : 'rgba(255,255,255,0.72)';
      r.rings.forEach(function (ring) {
        ctx.save();
        ctx.beginPath();
        ring.forEach(function (p, i) {
          if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        });
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      });
    });

    // Contornos a lápis/tinta
    renderables.forEach(function (r) {
      r.rings.forEach(function (ring) {
        drawHandOutline(ctx, ring);
      });
    });

    // Rótulos dos distritos
    renderables.forEach(function (r, idx) {
      const rng = makeRng(idx * 199 + 11);
      drawDistrictLabel(ctx, r.flat, r.d.name, r.pinned, rng, fontFamily, width);
    });

    if (opts.deco !== false) {
      drawCompass(ctx, width * 0.10, height * 0.12, width * 0.022, fontFamily);
      drawMarginDeco(ctx, renderables, width, height, fontFamily);
    }
    drawSketchFrame(ctx, width, height);

    return canvas;
  }

  window.renderDrawnMap = renderDrawnMap;
})();
