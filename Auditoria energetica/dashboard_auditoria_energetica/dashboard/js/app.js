/* Tablero de auditoría energética — lógica de la página.
   Los datos vienen de data/datos.js (exportado desde el notebook de Python). */
(function () {
  'use strict';
  const DATA = window.DATA;
  if (!DATA) { document.querySelector('main').insertAdjacentHTML('afterbegin', '<p class="insight">No se encontró data/datos.js. Ejecute el notebook y copie el archivo exportado en la carpeta data.</p>'); return; }
  const { fmt, tip } = Charts;
  const $ = id => document.getElementById(id);
  const sum = a => a.reduce((s, x) => s + x, 0), mean = a => sum(a) / a.length;
  const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const toDate = d => new Date(d + 'T12:00:00');
  const dateLbl = d => { const dt = toDate(d); return DOW[dt.getDay()] + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1); };

  /* ---------- Preparar filas ---------- */
  const S = DATA.serie;
  const rows = S.t.map((t, i) => {
    const [d, h] = t.split(' '), hh = +h, lab = S.lab[i] === 1;
    return { d, h: hh, e: S.e[i], o: S.o[i], tc: S.tc[i], lab, op: lab && hh >= 7 && hh <= 19 };
  });
  const days = [...new Set(rows.map(r => r.d))];
  const idx = {}; rows.forEach(r => idx[r.d + '|' + r.h] = r);
  const opR = rows.filter(r => r.op), offR = rows.filter(r => !r.op);
  const eTot = sum(rows.map(r => r.e)), eOff = sum(offR.map(r => r.e));
  const base = mean(offR.map(r => r.e)), carga = mean(opR.map(r => r.e));
  const best = DATA.modelos.filter(m => m.variables !== '-').reduce((a, b) => a.MAE_kWh < b.MAE_kWh ? a : b);

  $('meta').textContent = `Auditoría energética exprés · ${dateLbl(days[0])} a ${dateLbl(days.at(-1))} de 2026 · ${rows.length.toLocaleString('es-CO')} horas medidas`;

  /* ---------- Tema claro/oscuro ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem('tema'); if (t) root.dataset.theme = t; } catch (e) {}
  $('theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('tema', root.dataset.theme); } catch (e) {}
  });

  /* ---------- Navegación: resaltar sección visible ---------- */
  const links = [...document.querySelectorAll('.topnav ul a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section.q').forEach(s => io.observe(s));
  }

  /* ---------- Fachada adaptable ----------
     Pantalla ancha: columnas = días, pisos = horas.
     Móvil: filas = días, columnas = horas (sin scroll horizontal). */
  const fac = $('facade');
  const lit = [240, 180, 41], off = [47, 66, 86];
  const mix = v => { const k = Math.min(1, Math.max(0, (v - 3) / 19)), kk = Math.pow(k, 1.35); return `rgb(${off.map((c, i) => Math.round(c + (lit[i] - c) * kk)).join(',')})`; };
  const cell = r => `<div class="w ${r.op ? 'op' : 'off'}" data-k="${r.d}|${r.h}" style="background:${mix(r.e)}"></div>`;
  const isWe = d => toDate(d).getDay() % 6 === 0;
  const mqNarrow = matchMedia('(max-width: 640px)');

  function drawFacade() {
    const narrow = mqNarrow.matches; let h = '';
    if (!narrow) {
      fac.className = 'facade horiz' + (fac.classList.contains('solo-fuera') ? ' solo-fuera' : '');
      fac.style.gridTemplateColumns = `32px repeat(${days.length}, minmax(0, 1fr))`;
      for (let hr = 23; hr >= 0; hr--) {
        h += `<div class="lbl y">${String(hr).padStart(2, '0')}h</div>` + days.map(d => cell(idx[d + '|' + hr])).join('');
      }
      h += '<div></div>' + days.map((d, j) => {
        const dt = toDate(d), we = isWe(d), show = j % 3 === 0 || dt.getDate() === 1;
        return `<div class="lbl x ${we ? 'wk' : ''}">${show ? dt.getDate() : we ? '•' : ''}</div>`;
      }).join('');
      $('facadeLede').textContent = 'Cada ventana de la fachada es una hora medida. Las columnas son los 45 días; los pisos, las 24 horas. Cuanto más encendida la ventana, más kWh se consumieron esa hora.';
    } else {
      fac.className = 'facade vert' + (fac.classList.contains('solo-fuera') ? ' solo-fuera' : '');
      fac.style.gridTemplateColumns = `50px repeat(24, minmax(0, 1fr))`;
      h += '<div></div>';
      for (let hr = 0; hr < 24; hr++) h += `<div class="lbl x">${hr % 6 === 0 ? hr + 'h' : ''}</div>`;
      days.forEach(d => {
        h += `<div class="lbl y ${isWe(d) ? 'wk' : ''}">${dateLbl(d)}</div>`;
        for (let hr = 0; hr < 24; hr++) h += cell(idx[d + '|' + hr]);
      });
      $('facadeLede').textContent = 'Cada celda es una hora medida. Cada fila es un día y cada columna una hora. Cuanto más encendida la celda, más kWh se consumieron esa hora.';
    }
    fac.innerHTML = h;
    fac.style.setProperty('--cols', narrow ? 24 : days.length);
    fac.setAttribute('aria-label', `Mapa de calor de ${rows.length} horas: el consumo es alto de 07 a 19 h en días laborales y se mantiene cerca de ${fmt(base, 1)} kWh por hora el resto del tiempo.`);
  }
  drawFacade();
  mqNarrow.addEventListener('change', drawFacade);

  let selCell = null;
  function facadeTip(ev) {
    const k = ev.target.dataset && ev.target.dataset.k;
    if (!k) { if (ev.pointerType === 'mouse') tip.hide(); return; }
    const r = idx[k];
    if (ev.type === 'pointerdown') { if (selCell) selCell.classList.remove('sel'); selCell = ev.target; selCell.classList.add('sel'); }
    tip.show(ev, `<b>${dateLbl(r.d)} · ${String(r.h).padStart(2, '0')}:00</b><br>${fmt(r.e, 1)} kWh · ${r.o} personas<br>${fmt(r.tc, 1)} °C · ${r.op ? 'en operación' : 'sin operación'}`);
  }
  fac.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') facadeTip(ev); });
  fac.addEventListener('pointerdown', facadeTip);
  fac.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') tip.hide(); });
  document.addEventListener('pointerdown', ev => {
    if (!ev.target.closest('.facade, svg.chart')) { tip.hide(); if (selCell) { selCell.classList.remove('sel'); selCell = null; } }
  });
  if (matchMedia('(hover: none)').matches) $('facadeHelp').textContent = 'Toque una ventana para ver el detalle de esa hora.';

  const bF = $('btnFuera');
  bF.addEventListener('click', () => {
    const on = bF.getAttribute('aria-pressed') !== 'true';
    bF.setAttribute('aria-pressed', on); fac.classList.toggle('solo-fuera', on);
  });

  /* ---------- Cifras clave ---------- */
  $('facts').innerHTML = [
    [fmt(eOff / eTot * 100, 0) + ' %', 'de la energía se usa fuera del horario de operación'],
    [fmt(base, 1) + ' kWh/h', 'carga base de noche y fines de semana, con 3–4 personas'],
    [fmt(carga, 1) + ' kWh/h', 'consumo promedio en horario laboral (07–19 h)'],
    ['± ' + fmt(best.MAE_kWh, 1) + ' kWh', 'error medio del modelo de predicción (R² ' + fmt(best.R2, 2) + ')']
  ].map(([b, s]) => `<div><b class="num">${b}</b><span>${s}</span></div>`).join('');

  /* ---------- Tabla de auditoría ---------- */
  const A = DATA.auditoria, F = A.faltantes;
  const audit = [
    ['Completitud', 'Valores faltantes por columna', `energía ${F.energia_kwh}, temperatura ${F.temperatura_c}, HVAC ${F.estado_hvac} (todos < 1 %)`, 'Interpolación temporal en energía y temperatura; HVAC según la regla observada (encendido solo laboral 07–19 h, se cumple en 99,6 % de las horas)', false],
    ['Unicidad', 'Marcas de tiempo repetidas', `${A.duplicados} horas duplicadas (filas idénticas); ${A.filas_originales.toLocaleString('es-CO')} filas para 1.080 horas`, 'Se conserva una fila por hora', false],
    ['Validez', 'Energía negativa (imposible)', `${A.negativos} registros con −5 kWh`, 'Se convierten en faltantes y se interpolan', false],
    ['Consistencia', 'Escritura de estado_hvac', '5 registros como “encendido ” (minúscula y espacio)', 'Se unifica a “Encendido”', false],
    ['Valores atípicos', 'Picos extremos de energía', '1 hora con 55,8 kWh (3× lo normal)', 'Se conserva: la demanda lo confirma; es un hallazgo operativo', true]
  ];
  const H1 = ['Dimensión', 'Qué revisamos', 'Hallazgo', 'Decisión'];
  $('audit').innerHTML = audit.map(a => `<tr>
    <td data-label="${H1[0]}"><b>${a[0]}</b></td><td data-label="${H1[1]}">${a[1]}</td>
    <td data-label="${H1[2]}"><span><span class="tag ${a[4] ? 'ok' : ''}">${a[4] ? 'real' : 'corregido'}</span> ${a[2]}</span></td>
    <td data-label="${H1[3]}">${a[3]}</td></tr>`).join('');

  /* ---------- Perfil horario ---------- */
  const COL = { 'Laboral': 'var(--teal)', 'Fin de semana': 'var(--lit)' };
  const perfil = {};
  ['Laboral', 'Fin de semana'].forEach(t => perfil[t] = [...Array(24)].map((_, h) =>
    mean(rows.filter(r => r.h === h && (r.lab ? 'Laboral' : 'Fin de semana') === t).map(r => r.e))));

  function drawProfile(mode) {
    const types = mode === 'ambos' ? ['Laboral', 'Fin de semana'] : [mode];
    Charts.line($('chProfile'), {
      labels: [...Array(24).keys()], yMax: 20, yLabel: 'kWh promedio',
      series: types.map(t => ({ name: t, color: COL[t], values: perfil[t], dots: true })),
      bands: [{ from: 7, to: 19, label: 'horario de operación 07–19 h', short: '07–19 h' }],
      hlines: [{ y: base, label: `- - - carga base ≈ ${fmt(base, 1)} kWh/h`, labelAt: 7, labelY: 4 }],
      xTick: (i, narrow) => i % (narrow ? 4 : 2) === 0 ? i + 'h' : null,
      tooltip: i => `<b>${i}:00 h</b><br>` + types.map(t => `${t}: ${fmt(perfil[t][i], 1)} kWh`).join('<br>')
    });
    const L = perfil['Laboral'];
    $('insProfile').textContent = mode === 'Fin de semana'
      ? `El fin de semana el consumo es plano, alrededor de ${fmt(base, 1)} kWh/h, aunque el HVAC está apagado y casi no hay personas.`
      : `En días laborales el consumo salta de ${fmt(L[6], 1)} a ${fmt(L[7], 1)} kWh a las 07:00 (arranque) y cae a ${fmt(L[20], 1)} a las 20:00. De noche y los fines de semana se mantiene cerca de ${fmt(base, 1)} kWh/h: el edificio nunca llega a apagarse.`;
  }
  drawProfile('ambos');
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(o => o.setAttribute('aria-pressed', o === b));
    drawProfile(b.dataset.k);
  }));

  /* ---------- Dispersión ocupación ---------- */
  Charts.scatter($('chScatter'), {
    xMax: 160, xStep: 40, yMax: 30, xLabel: 'personas', yLabel: 'kWh',
    points: rows.map(r => ({ x: r.o, y: r.e, c: r.op ? 'var(--teal)' : 'var(--muted)', o: r.op ? .6 : .35 }))
  });
  const corr = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0; a.forEach((v, i) => { n += (v - ma) * (b[i] - mb); da += (v - ma) ** 2; db += (b[i] - mb) ** 2; }); return n / Math.sqrt(da * db); };
  const rOcc = corr(rows.map(r => r.o), rows.map(r => r.e));
  const occ = opR.filter(r => r.o > 0), xs = occ.map(r => r.o), ys = occ.map(r => r.e), mx = mean(xs), my = mean(ys);
  const slope = sum(xs.map((v, i) => (v - mx) * (ys[i] - my))) / sum(xs.map(v => (v - mx) ** 2));
  $('insScatter').textContent = `La ocupación es el motor principal (correlación ${fmt(rOcc, 2)}): cada 10 personas más suman unos ${fmt(slope * 10, 1)} kWh por hora. El punto aislado arriba es el pico de arranque del lunes 20 de abril.`;

  /* ---------- Barras de temperatura ---------- */
  const bins = [[-99, 18, '<18'], [18, 20, '18–20'], [20, 22, '20–22'], [22, 24, '22–24'], [24, 26, '24–26'], [26, 99, '>26']];
  const tv = bins.map(([a, b, l]) => { const e = opR.filter(r => r.tc > a && r.tc <= b && r.e < 40).map(r => r.e); return { l, v: mean(e), n: e.length }; });
  const minV = Math.min(...tv.map(v => v.v));
  Charts.bars($('chTemp'), { yMax: 20, yLabel: 'kWh promedio',
    items: tv.map(d => ({ ...d, c: d.v === minV ? 'var(--teal)' : 'var(--lit)', title: `${d.l} °C: ${fmt(d.v, 1)} kWh (${d.n} h)` })) });

  /* ---------- Tabla de modelos ---------- */
  const H2 = ['Modelo', 'Variables', 'Error medio (kWh/h)', 'R²'];
  $('models').innerHTML = DATA.modelos.map(m => `<tr class="${m === best ? 'best' : ''}">
    <td data-label="${H2[0]}"><span>${m.modelo}${m === best ? ' <span class="tag ok">mejor</span>' : ''}</span></td>
    <td data-label="${H2[1]}">${m.variables === '-' ? 'ninguna' : m.variables === 'extendido' ? 'ocupación, temperatura, horario, distancia a 22 °C' : m.variables}</td>
    <td class="r num" data-label="${H2[2]}">${fmt(m.MAE_kWh, 2)}</td>
    <td class="r num" data-label="${H2[3]}">${fmt(m.R2, 2)}</td></tr>`).join('');

  /* ---------- Real vs predicho ---------- */
  const P = DATA.prueba;
  Charts.line($('chTest'), {
    labels: P.t, yMax: 30, yLabel: 'kWh', ratio: .32, ratioNarrow: .75,
    series: [{ name: 'real', color: 'var(--ink)', values: P.real, width: 1.2 }, { name: 'predicho', color: 'var(--lit)', values: P.pred, width: 2 }],
    vlines: narrow => { let k = 0; return P.t.map((t, i) => t.endsWith(' 00') ? { i, label: (!narrow || (k++ % 2 === 0)) ? (narrow ? toDate(t.split(' ')[0]).getDate() + '/5' : dateLbl(t.split(' ')[0])) : '' } : null).filter(Boolean); },
    tooltip: i => `<b>${dateLbl(P.t[i].split(' ')[0])} · ${P.t[i].split(' ')[1]}:00</b><br>Real: ${fmt(P.real[i], 1)} kWh<br>Predicho: ${fmt(P.pred[i], 1)} kWh`
  });

  /* ---------- Simulador (coeficientes del modelo lineal de Python) ---------- */
  const C = DATA.lineal.coef, b0 = DATA.lineal.intercepto, mae = best.MAE_kWh;
  function simulate() {
    const o = +$('occ').value, t = +$('tmp').value, h = $('hor').checked ? 1 : 0;
    $('oOcc').textContent = o; $('oTmp').textContent = fmt(t, 1) + ' °C';
    const p = Math.max(0, b0 + C.ocupacion * o + C.temperatura_c * t + C.en_horario * h + C.desv_confort * Math.abs(t - 22) * h);
    $('pred').textContent = fmt(p, 1);
    $('predRange').textContent = `kWh estimados en esa hora (entre ${fmt(Math.max(0, p - mae), 1)} y ${fmt(p + mae, 1)})`;
    $('gauge').style.width = Math.min(100, p / 25 * 100) + '%';
  }
  ['occ', 'tmp', 'hor'].forEach(id => $(id).addEventListener('input', simulate)); simulate();

  /* ---------- Ahorro ---------- */
  function savings() {
    const red = +$('red').value / 100, tar = +$('tar').value || 0;
    $('oRed').textContent = Math.round(red * 100) + ' %';
    const k45 = eOff * red, kAno = k45 * 365 / days.length;
    $('saveKwh').innerHTML = Math.round(kAno).toLocaleString('es-CO') + '<span> kWh/año</span>';
    $('saveTxt').textContent = `${Math.round(k45).toLocaleString('es-CO')} kWh en estos ${days.length} días · ≈ $${Math.round(kAno * tar).toLocaleString('es-CO')} COP al año`;
  }
  ['red', 'tar'].forEach(id => $(id).addEventListener('input', savings)); savings();

  $('conclusion').textContent = `El ${fmt(eOff / eTot * 100, 0)} % de la energía se consume fuera del horario de operación, con apenas 3 o 4 personas en el edificio: hay una carga base de ${fmt(base, 1)} kWh cada hora que no depende de la ocupación. El consumo se puede predecir con un error medio de ${fmt(mae, 1)} kWh por hora; la ocupación es lo que más pesa y la temperatura solo influye fuera de 20–24 °C. Recomendamos programar el apagado de iluminación y equipos a las 20:00 y los fines de semana: reducir la carga base un 30 % ahorraría cerca de ${Math.round(eOff * .3 * 365 / days.length).toLocaleString('es-CO')} kWh al año.`;
})();
