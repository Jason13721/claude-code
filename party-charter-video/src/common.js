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
    D.box(x - s / 2, y - s / 2, s, s, { r: 8, fill: '#3a1a1e', stroke: C.v, lw: 3, alpha: a });
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
      D.circle(px, py, r, { fill: E.mix('#3a1a1e', colors[li % colors.length], on), stroke: colors[li % colors.length], lw: 2, alpha });
    }));
    return pos;
  };

  // a "card" panel
  H.panel = (D, x, y, w, h, o = {}) => {
    const { title = null, color = C.dim, alpha = 1, fill = 'rgba(52,20,25,0.80)' } = o;
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

  // --------- icons for the party-charter video ---------
  // Shikumen (stone-framed gate) – the architectural signature of the 2nd Congress site
  H.shikumen = (D, x, y, s, a = 1) => {
    const ctx = D.ctx;
    const w = s * 1.1, h = s * 1.5;
    D.box(x - w / 2 - s * 0.12, y - h - s * 0.1, w + s * 0.24, h + s * 0.1, { r: 4, fill: '#3b2a24', stroke: '#c9a596', lw: 2, alpha: a });
    // pediment
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#5a4034'; ctx.strokeStyle = '#e0c8a8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - w / 2 - s * 0.2, y - h - s * 0.1); ctx.quadraticCurveTo(x, y - h - s * 0.55, x + w / 2 + s * 0.2, y - h - s * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // doors
    D.box(x - w / 2, y - h + s * 0.15, w / 2 - 2, h - s * 0.15, { r: 2, fill: '#1a0a08', stroke: '#8a5a3c', lw: 2, alpha: a });
    D.box(x + 2, y - h + s * 0.15, w / 2 - 2, h - s * 0.15, { r: 2, fill: '#1a0a08', stroke: '#8a5a3c', lw: 2, alpha: a });
    D.circle(x - s * 0.08, y - h * 0.45, s * 0.04, { fill: C.q, alpha: a });
    D.circle(x + s * 0.08, y - h * 0.45, s * 0.04, { fill: C.q, alpha: a });
  };
  H.lock = (D, x, y, s, color = C.q, a = 1) => {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = s * 0.12;
    ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.28, Math.PI, 0); ctx.stroke(); ctx.restore();
    D.box(x - s * 0.42, y - s * 0.15, s * 0.84, s * 0.65, { r: s * 0.1, fill: color, alpha: a });
    D.circle(x, y + s * 0.12, s * 0.08, { fill: '#2a1216', alpha: a });
  };
  H.page = (D, x, y, w, h, o = {}) => {
    const { alpha = 1, lines = 6, title = null, fill = C.paper, ink = '#8a7a6a', rot = 0, titleColor = '#3a2020' } = o;
    const ctx = D.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    D.box(-w / 2, -h / 2, w, h, { r: 4, fill, alpha });
    let y0 = -h / 2 + h * 0.14;
    if (title) { D.text(title, 0, y0, { size: Math.min(w * 0.1, 30), color: titleColor, weight: 700, alpha }); y0 += h * 0.12; }
    for (let i = 0; i < lines; i++) { const ww = w * (0.72 - (i % 3) * 0.08); D.line(-ww / 2, y0 + i * h * 0.1, ww / 2, y0 + i * h * 0.1, { color: ink, lw: Math.max(2, h * 0.02), alpha: alpha * 0.6 }); }
    ctx.restore();
  };
  H.stamp = (D, x, y, r, text, color = C.red, a = 1, rot = -0.25) => {
    const ctx = D.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    D.circle(0, 0, r, { stroke: color, lw: r * 0.08, alpha: a });
    D.circle(0, 0, r * 0.82, { stroke: color, lw: r * 0.03, alpha: a });
    D.text(text, 0, 2, { size: r * 0.5, weight: 900, color, alpha: a });
    ctx.restore();
  };
  H.phoneFrame = (D, x, y, w, h, a = 1) => {
    D.box(x - w / 2, y - h / 2, w, h, { r: w * 0.12, fill: '#1d0d10', stroke: C.text, lw: 4, alpha: a });
    D.box(x - w * 0.15, y - h / 2 + 12, w * 0.3, 8, { r: 4, fill: '#5e3238', alpha: a });
  };
  H.server = (D, x, y, s, color = C.k, a = 1) => {
    for (let i = 0; i < 3; i++) {
      D.box(x - s / 2, y - s * 0.6 + i * s * 0.42, s, s * 0.34, { r: 6, fill: hexA(color, 0.18), stroke: color, lw: 2, alpha: a });
      D.circle(x - s * 0.32, y - s * 0.43 + i * s * 0.42, s * 0.04, { fill: C.v, alpha: a });
      D.line(x - s * 0.1, y - s * 0.43 + i * s * 0.42, x + s * 0.35, y - s * 0.43 + i * s * 0.42, { color, lw: 2, alpha: a * 0.6 });
    }
  };
  H.cloud = (D, x, y, s, color = C.k, a = 1) => {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = hexA(color, 0.2); ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x - s * 0.3, y, s * 0.28, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(x - s * 0.05, y - s * 0.25, s * 0.32, Math.PI, Math.PI * 1.9);
    ctx.arc(x + s * 0.3, y - s * 0.02, s * 0.27, Math.PI * 1.4, Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  };
  H.tome = (D, x, y, s, open, color = C.q, a = 1) => {
    if (open) {
      D.box(x - s, y - s * 0.6, s, s * 1.2, { r: 6, fill: C.paper, alpha: a });
      D.box(x, y - s * 0.6, s, s * 1.2, { r: 6, fill: '#efe4cc', alpha: a });
      for (let i = 0; i < 5; i++) { D.line(x - s * 0.85, y - s * 0.35 + i * s * 0.2, x - s * 0.15, y - s * 0.35 + i * s * 0.2, { color: '#a08a70', lw: 3, alpha: a }); D.line(x + s * 0.15, y - s * 0.35 + i * s * 0.2, x + s * 0.85, y - s * 0.35 + i * s * 0.2, { color: '#a08a70', lw: 3, alpha: a }); }
      D.line(x, y - s * 0.6, x, y + s * 0.6, { color: '#a08a70', lw: 3, alpha: a });
    } else {
      D.box(x - s * 0.55, y - s * 0.7, s * 1.1, s * 1.4, { r: 8, fill: color, alpha: a });
      D.box(x - s * 0.4, y - s * 0.35, s * 0.8, s * 0.25, { r: 4, fill: 'rgba(255,255,255,0.75)', alpha: a });
    }
  };
  H.crowd = (D, x, y, s, colors, a = 1) => {
    colors.forEach((c, i) => H.person(D, x + (i - (colors.length - 1) / 2) * s * 0.7, y + (i % 2) * s * 0.1, s, c, a));
  };
  H.check = (D, x, y, s, color = C.v, a = 1) => {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = s * 0.18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x - s * 0.1, y + s * 0.3); ctx.lineTo(x + s * 0.45, y - s * 0.35); ctx.stroke(); ctx.restore();
  };
  H.cross = (D, x, y, s, color = C.red, a = 1) => {
    D.line(x - s * 0.35, y - s * 0.35, x + s * 0.35, y + s * 0.35, { color, lw: s * 0.18, alpha: a });
    D.line(x + s * 0.35, y - s * 0.35, x - s * 0.35, y + s * 0.35, { color, lw: s * 0.18, alpha: a });
  };
  // gate arch for the "four security checkpoints"
  H.gate = (D, x, y, w, h, color, label, sub, a = 1, glow = 0) => {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = hexA(color, 0.16); ctx.strokeStyle = color; ctx.lineWidth = 4;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + w / 2); ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.3, y - h * 0.45); ctx.arc(x, y - h * 0.45, w * 0.3, 0, Math.PI, true); ctx.lineTo(x - w * 0.3, y); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
    D.text(label, x, y - h + w * 0.42, { size: w * 0.19, weight: 900, color, alpha: a });
    if (sub) D.text(sub, x, y + 34, { size: 24, color: C.dim, alpha: a });
  };

  window.H = H;
  window.SCENES = [];
})();
