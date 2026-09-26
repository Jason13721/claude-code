// Shared scene helpers: layouts, icons, a tiny formula typesetter.
(function () {
  const E = window.ENGINE;
  const { C, clamp, lerp, hexA, MATH, MAIN, MONO, FONT } = E;
  const H = {};

  // x-centres for a row of chips
  H.rowX = (D, words, cx, o = {}) => {
    const { size = 40, gap = 22, pad = 26, weight = 500 } = o;
    const ws = words.map(w => D.measure(w, size, weight) + pad * 2);
    const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    let x = cx - total / 2; const xs = [];
    ws.forEach(w => { xs.push(x + w / 2); x += w + gap; });
    return { xs, ws, total };
  };

  // --------- formula typesetter ---------
  // node forms:
  //  'x'                      – italic math variable (KaTeX_Math)
  //  {s, fam, color}          – text run
  //  {sup:[..], base:[..]}    – superscript;  {sub:[..], base:[..]} – subscript
  //  {num:[..], den:[..]}     – fraction;     {sqrt:[..]} – square root
  //  {group:[..], color, alpha, glow}
  function lay(D, node, size, inherit) {
    const ctx = D.ctx;
    if (Array.isArray(node)) {
      const kids = node.map(n => lay(D, n, size, inherit));
      const w = kids.reduce((a, k) => a + k.w, 0);
      const up = Math.max(0, ...kids.map(k => k.up)), down = Math.max(0, ...kids.map(k => k.down));
      return { w, up, down, draw(x, y, a) { let cx = x; kids.forEach(k => { k.draw(cx, y, a); cx += k.w; }); } };
    }
    if (typeof node === 'string') node = { s: node, fam: /^[A-Za-z]+$/.test(node) && node.length <= 2 ? MATH : MAIN };
    const st = { ...inherit };
    if (node.color) st.color = node.color;
    if (node.alpha !== undefined) st.alpha = (st.alpha ?? 1) * node.alpha;
    if (node.s !== undefined) {
      const fam = node.fam || MAIN;
      const w = D.measure(node.s, size, node.weight || 400, fam) + (node.pad || 0) * size;
      return { w, up: size * 0.75, down: size * 0.25, draw(x, y, a) {
        D.text(node.s, x + (node.pad || 0) * size / 2, y, { size, fam, color: st.color || C.text, align: 'left', base: 'alphabetic', alpha: a * (st.alpha ?? 1), weight: node.weight || 400, glow: node.glow || 0 });
      } };
    }
    if (node.group) {
      const g = lay(D, node.group, size, st);
      return { ...g, draw(x, y, a) {
        if (node.box) { D.box(x - 6, y - g.up - 8, g.w + 12, g.up + g.down + 16, { r: 10, stroke: node.box, lw: 3, alpha: a * node.boxA, fill: hexA(node.box, 0.12 * (node.boxA ?? 1)) }); }
        g.draw(x, y, a);
      } };
    }
    if (node.sup || node.sub) {
      const b = lay(D, node.base, size, st);
      const s = lay(D, node.sup || node.sub, size * 0.62, st);
      const dy = node.sup ? -size * 0.42 : size * 0.22;
      return { w: b.w + s.w + size * 0.04, up: Math.max(b.up, s.up - dy), down: Math.max(b.down, s.down + dy), draw(x, y, a) { b.draw(x, y, a); s.draw(x + b.w + size * 0.04, y + dy, a); } };
    }
    if (node.num) {
      const n = lay(D, node.num, size * 0.9, st), d = lay(D, node.den, size * 0.9, st);
      const w = Math.max(n.w, d.w) + size * 0.3, axis = size * 0.28, gap = size * 0.12;
      return { w: w + size * 0.2, up: axis + gap + n.down + n.up, down: -axis + gap + d.up + d.down + size * 0.05, draw(x, y, a) {
        const x0 = x + size * 0.1;
        n.draw(x0 + (w - n.w) / 2, y - axis - gap - n.down, a);
        d.draw(x0 + (w - d.w) / 2, y - axis + gap + d.up, a);
        D.line(x0, y - axis, x0 + w, y - axis, { color: st.color || C.text, lw: Math.max(2, size * 0.045), alpha: a * (st.alpha ?? 1), cap: 'butt' });
      } };
    }
    if (node.sqrt) {
      const b = lay(D, node.sqrt, size, st);
      const lead = size * 0.55;
      return { w: b.w + lead + size * 0.1, up: b.up + size * 0.15, down: b.down, draw(x, y, a) {
        const top = y - b.up - size * 0.08, bot = y + b.down;
        ctx.save(); ctx.globalAlpha *= a * (st.alpha ?? 1); ctx.strokeStyle = st.color || C.text; ctx.lineWidth = Math.max(2, size * 0.05); ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x, y - size * 0.25); ctx.lineTo(x + lead * 0.25, y - size * 0.33); ctx.lineTo(x + lead * 0.55, bot);
        ctx.lineTo(x + lead * 0.9, top); ctx.lineTo(x + lead + b.w + size * 0.08, top); ctx.stroke(); ctx.restore();
        b.draw(x + lead, y, a);
      } };
    }
    return { w: 0, up: 0, down: 0, draw() {} };
  }
  H.formula = (D, node, x, y, o = {}) => {
    const { size = 64, align = 'center', alpha = 1 } = o;
    const L = lay(D, node, size, {});
    const x0 = align === 'center' ? x - L.w / 2 : align === 'right' ? x - L.w : x;
    L.draw(x0, y, alpha);
    return { w: L.w, x0, up: L.up, down: L.down };
  };
  H.fw = (D, node, size) => lay(D, node, size, {}).w;

  // curly brace under a span with a label
  H.brace = (D, x1, x2, y, label, o = {}) => {
    const { color = C.dim, alpha = 1, size = 30, p = 1 } = o;
    if (alpha <= 0) return;
    const ctx = D.ctx, m = (x1 + x2) / 2, h = 16;
    ctx.save(); ctx.globalAlpha *= alpha * p; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo(x1, y + h, x1 + h, y + h);
    ctx.lineTo(m - h, y + h); ctx.quadraticCurveTo(m, y + h, m, y + 2 * h); ctx.quadraticCurveTo(m, y + h, m + h, y + h);
    ctx.lineTo(x2 - h, y + h); ctx.quadraticCurveTo(x2, y + h, x2, y); ctx.stroke(); ctx.restore();
    if (label) D.text(label, m, y + 2 * h + size * 0.9, { size, color, alpha: alpha * p, weight: 500 });
  };

  // --------- icons ---------
  H.apple = (D, x, y, s, a = 1) => {
    D.circle(x - s * 0.22, y, s * 0.42, { fill: '#ff5b5b', alpha: a });
    D.circle(x + s * 0.22, y, s * 0.42, { fill: '#ff5b5b', alpha: a });
    D.circle(x, y + s * 0.12, s * 0.4, { fill: '#ff5b5b', alpha: a });
    D.line(x, y - s * 0.35, x + s * 0.08, y - s * 0.62, { color: '#8a5a2b', lw: s * 0.08, alpha: a });
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#7ae582';
    ctx.beginPath(); ctx.ellipse(x + s * 0.25, y - s * 0.55, s * 0.2, s * 0.09, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  H.phone = (D, x, y, s, a = 1) => {
    D.box(x - s * 0.32, y - s * 0.6, s * 0.64, s * 1.2, { r: s * 0.1, fill: '#2b3350', stroke: '#c9d2ff', lw: 3, alpha: a });
    D.box(x - s * 0.26, y - s * 0.5, s * 0.52, s * 0.95, { r: s * 0.04, fill: '#4cc9f0', alpha: a * 0.7 });
    D.circle(x, y + s * 0.52, s * 0.035, { fill: '#c9d2ff', alpha: a });
  };
  H.person = (D, x, y, s, color, a = 1) => {
    D.circle(x, y - s * 0.35, s * 0.22, { fill: color, alpha: a });
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y + s * 0.3, s * 0.38, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  H.gpu = (D, x, y, s, a = 1) => {
    D.box(x - s / 2, y - s / 2, s, s, { r: 8, fill: '#1f2a4d', stroke: C.v, lw: 3, alpha: a });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) D.box(x - s * 0.36 + i * s * 0.19, y - s * 0.36 + j * s * 0.19, s * 0.14, s * 0.14, { r: 2, fill: hexA(C.v, 0.6), alpha: a });
    for (let i = 0; i < 5; i++) { const o = -s * 0.4 + i * s * 0.2; D.line(x + o, y - s / 2, x + o, y - s / 2 - 10, { color: C.v, lw: 3, alpha: a }); D.line(x + o, y + s / 2, x + o, y + s / 2 + 10, { color: C.v, lw: 3, alpha: a }); }
  };
  H.book = (D, x, y, w, h, color, label, a = 1) => {
    D.box(x - w / 2, y - h / 2, w, h, { r: 6, fill: hexA(color, 0.3), stroke: color, lw: 2.5, alpha: a });
    D.line(x - w / 2 + 8, y - h / 2 + 10, x - w / 2 + 8, y + h / 2 - 10, { color, lw: 2, alpha: a * 0.6 });
    if (label) {
      const ctx = D.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
      D.text(label, 0, 2, { size: Math.min(26, w * 0.5), color: C.text, alpha: a, weight: 500 }); ctx.restore();
    }
  };
  H.brain = (D, x, y, s, a = 1, glow = 0) => {
    D.circle(x, y, s, { fill: hexA(C.purple, 0.25), stroke: C.purple, lw: 3, alpha: a, glow });
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.purple; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.bezierCurveTo(x - s * 0.3, y - s * 0.3, x + s * 0.3, y + s * 0.3, x, y + s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - s * 0.45, y - s * 0.2, s * 0.25, 0.5, 3.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + s * 0.45, y + s * 0.25, s * 0.25, 3.6, 6.6); ctx.stroke(); ctx.restore();
  };

  // simple fully connected net; pulse = 0..1 signal travelling left→right
  H.net = (D, layers, x, y, w, h, o = {}) => {
    const { alpha = 1, pulse = -1, colors = [C.k, C.purple, C.q], act = null, r = 13 } = o;
    const pos = layers.map((n, li) => Array.from({ length: n }, (_, i) => [x + li * w / (layers.length - 1), y + (n === 1 ? h / 2 : i * h / (n - 1))]));
    for (let li = 0; li < layers.length - 1; li++) {
      for (const a of pos[li]) for (const b of pos[li + 1]) {
        D.line(a[0], a[1], b[0], b[1], { color: C.faint, lw: 1.2, alpha: alpha * 0.7 });
      }
    }
    if (pulse >= 0) {
      const seg = pulse * (layers.length - 1), li = Math.floor(seg), f = seg - li;
      if (li < layers.length - 1) for (const a of pos[li]) for (const b of pos[li + 1]) {
        D.circle(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 3.2, { fill: C.yellow, alpha: alpha * 0.8 });
      }
    }
    pos.forEach((L, li) => L.forEach(([px, py], i) => {
      const on = act ? act(li, i) : 0.5;
      D.circle(px, py, r, { fill: E.mix('#1a2148', colors[li % colors.length], on), stroke: colors[li % colors.length], lw: 2, alpha });
    }));
    return pos;
  };

  // a "card" panel
  H.panel = (D, x, y, w, h, o = {}) => {
    const { title = null, color = C.dim, alpha = 1, fill = 'rgba(20,28,62,0.75)' } = o;
    D.box(x, y, w, h, { r: 22, fill, stroke: hexA(color, 0.6), lw: 2, alpha });
    if (title) D.text(title, x + w / 2, y + 40, { size: 32, weight: 700, color, alpha });
  };

  // big step badge like  "① 打分"
  H.step = (D, n, label, x, y, o = {}) => {
    const { alpha = 1, color = C.q, size = 36 } = o;
    D.circle(x, y, size * 0.75, { fill: color, alpha });
    D.text(String(n), x, y + 2, { size: size * 0.9, weight: 900, color: '#1a1030', alpha, fam: MONO });
    D.text(label, x + size * 1.2, y + 2, { size, weight: 700, align: 'left', alpha, color });
  };

  window.H = H;
  window.SCENES = [];
})();
