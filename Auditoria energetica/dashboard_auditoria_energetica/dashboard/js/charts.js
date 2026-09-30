/* Mini motor de gráficos SVG adaptables (sin dependencias).
   Cada gráfico se dibuja según el ancho real de su contenedor y se
   vuelve a dibujar cuando ese ancho cambia (ResizeObserver). */
(function (global) {
  'use strict';
  const fmt = (x, d = 1) => x.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- Tooltip compartido (ratón y toque) ---------- */
  const tipEl = () => document.getElementById('tip');
  const tip = {
    show(ev, html) {
      const t = tipEl(); if (!t) return;
      t.innerHTML = html; t.style.display = 'block';
      const w = t.offsetWidth, h = t.offsetHeight;
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
      if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
      t.style.left = Math.max(8, x) + 'px'; t.style.top = Math.max(8, y) + 'px';
    },
    hide() { const t = tipEl(); if (t) t.style.display = 'none'; }
  };
  document.addEventListener('scroll', tip.hide, { passive: true });

  /* ---------- Utilidades ---------- */
  const scale = (d0, d1, r0, r1) => v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
  const size = (el, ratioWide, ratioNarrow) => {
    const W = Math.max(280, Math.round(el.clientWidth || 600));
    const narrow = W < 520;
    return { W, H: Math.round(W * (narrow ? ratioNarrow : ratioWide)), narrow };
  };
  function svgPoint(svg, ev) {
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function frame(W, H, m, yMax, yTicks, yLabel) {
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`;
    const y = scale(0, yMax, H - m.b, m.t);
    for (let i = 0; i <= yTicks; i++) {
      const v = yMax * i / yTicks;
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>` +
           `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 0)}</text>`;
    }
    if (yLabel) s += `<text x="${m.l}" y="${m.t - 8}">${yLabel}</text>`;
    return { s, y };
  }
  /* Interacción que funciona igual con ratón, lápiz y dedo */
  function bindHover(svg, onMove) {
    const move = ev => onMove(ev, svgPoint(svg, ev));
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') tip.hide(); });
  }

  /* ---------- Registro para redibujar al cambiar de tamaño ---------- */
  const registry = new Map();
  const ro = 'ResizeObserver' in global ? new ResizeObserver(entries => {
    entries.forEach(e => {
      const r = registry.get(e.target); if (!r) return;
      const w = Math.round(e.contentRect.width);
      if (w !== r.lastW) { r.lastW = w; clearTimeout(r.t); r.t = setTimeout(r.draw, 60); }
    });
  }) : null;
  function mount(el, draw) {
    const prev = registry.get(el);
    if (prev) clearTimeout(prev.t);
    registry.set(el, { draw, lastW: Math.round(el.clientWidth) });
    if (ro && !prev) ro.observe(el);
    draw();
  }

  /* ---------- Gráfico de líneas ---------- */
  function line(el, o) {
    mount(el, () => {
      const { W, H, narrow } = size(el, o.ratio || .34, o.ratioNarrow || .7);
      const m = { l: 36, r: 12, t: 28, b: 30 };
      const n = o.labels.length;
      const f = frame(W, H, m, o.yMax, o.yMax % 4 === 0 ? 4 : 3, o.yLabel); let s = f.s; const y = f.y;
      const x = scale(0, n - 1, m.l + 6, W - m.r - 6);
      (o.bands || []).forEach(b => {
        s += `<rect x="${x(b.from) - 6}" y="${m.t}" width="${x(b.to) - x(b.from) + 12}" height="${H - m.b - m.t}" fill="var(--teal)" opacity=".07"/>`;
        if (b.label) s += `<text x="${(x(b.from) + x(b.to)) / 2}" y="${m.t + 14}" text-anchor="middle">${narrow && b.short ? b.short : b.label}</text>`;
      });
      (o.hlines || []).forEach(h => {
        s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(h.y)}" y2="${y(h.y)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
        if (h.label) s += `<text x="${x(h.labelAt || 0) + 4}" y="${y(h.labelY != null ? h.labelY : h.y) }">${h.label}</text>`;
      });
      (o.vlines ? o.vlines(narrow) : []).forEach(v => {
        s += `<line x1="${x(v.i)}" x2="${x(v.i)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--grid)"/>`;
        if (v.label) s += `<text x="${x(v.i) + 3}" y="${H - 12}">${v.label}</text>`;
      });
      if (o.xTick) o.labels.forEach((l, i) => { const t = o.xTick(i, narrow); if (t != null) s += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${t}</text>`; });
      o.series.forEach(se => {
        s += `<polyline fill="none" stroke="${se.color}" stroke-width="${se.width || 2.5}" stroke-linejoin="round" points="${se.values.map((v, i) => x(i).toFixed(1) + ',' + y(Math.min(v, o.yMax)).toFixed(1)).join(' ')}"/>`;
        if (se.dots && !narrow) se.values.forEach((v, i) => s += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${se.color}"/>`);
      });
      if (o.legend !== false) {
        let lx = W - m.r;
        [...o.series].reverse().forEach(se => {
          s += `<text x="${lx}" y="${m.t - 8}" text-anchor="end" style="fill:${se.color};font-weight:600">— ${se.name}</text>`;
          lx -= (se.name.length * 6.6 + 26);
        });
      }
      s += `<line class="cursor" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--muted)" stroke-width="1" opacity="0"/></svg>`;
      el.innerHTML = s;
      const svg = el.querySelector('svg'), cur = svg.querySelector('.cursor');
      if (o.tooltip) bindHover(svg, (ev, p) => {
        const i = Math.round((p.x - (m.l + 6)) / ((W - m.r - 6) - (m.l + 6)) * (n - 1));
        if (i < 0 || i >= n) { tip.hide(); cur.setAttribute('opacity', 0); return; }
        cur.setAttribute('x1', x(i)); cur.setAttribute('x2', x(i)); cur.setAttribute('opacity', .5);
        tip.show(ev, o.tooltip(i));
      });
    });
  }

  /* ---------- Dispersión ---------- */
  function scatter(el, o) {
    mount(el, () => {
      const { W, H, narrow } = size(el, .66, .8);
      const m = { l: 34, r: 10, t: 22, b: 34 };
      const f = frame(W, H, m, o.yMax, 3, o.yLabel); let s = f.s; const y = f.y;
      const x = scale(0, o.xMax, m.l + 4, W - m.r);
      for (let v = 0; v <= o.xMax; v += o.xStep) s += `<text x="${x(v)}" y="${H - 16}" text-anchor="middle">${v}</text>`;
      s += `<text x="${W - m.r}" y="${H - 2}" text-anchor="end">${o.xLabel}</text>`;
      const r = narrow ? 2 : 2.4;
      o.points.forEach(p => s += `<circle cx="${x(p.x).toFixed(1)}" cy="${y(Math.min(p.y, o.yMax)).toFixed(1)}" r="${r}" fill="${p.c}" opacity="${p.o}"/>`);
      el.innerHTML = s + '</svg>';
    });
  }

  /* ---------- Barras ---------- */
  function bars(el, o) {
    mount(el, () => {
      const { W, H, narrow } = size(el, .66, .8);
      const m = { l: 34, r: 10, t: 22, b: 34 };
      const f = frame(W, H, m, o.yMax, 4, o.yLabel); let s = f.s; const y = f.y;
      const bw = (W - m.l - m.r) / o.items.length;
      o.items.forEach(d => {
        const i = o.items.indexOf(d), x0 = m.l + i * bw + bw * .16, w = bw * .68;
        s += `<rect x="${x0}" y="${y(d.v)}" width="${w}" height="${y(0) - y(d.v)}" fill="${d.c}" rx="1"><title>${d.title || ''}</title></rect>`;
        s += `<text x="${x0 + w / 2}" y="${y(d.v) - 5}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${fmt(d.v, 1)}</text>`;
        s += `<text x="${x0 + w / 2}" y="${H - 14}" text-anchor="middle">${narrow ? d.l : d.l + ' °C'}</text>`;
      });
      el.innerHTML = s + '</svg>';
    });
  }

  global.Charts = { line, scatter, bars, tip, fmt };
})(window);
