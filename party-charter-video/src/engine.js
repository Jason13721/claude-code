// Minimal deterministic canvas animation engine.
// Every frame is a pure function of time t, so the same code drives the live
// player (index.html) and the offline frame-by-frame renderer (tools/render.mjs).
(function () {
  const W = 1920, H = 1080;
  const FONT = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const MATH = 'KaTeX_Math, serif';
  const MAIN = 'KaTeX_Main, serif';

  const C = {
    bg0: '#12070a', bg1: '#2c1015',
    text: '#fbf1e4', dim: '#c9a596', faint: '#5e3238',
    q: '#f2c26b',   // gold – primary accent
    k: '#7fb8e6',   // sky – phase two / technology
    v: '#8fd18b',   // green – pass / ok
    pink: '#ff7a8a', purple: '#c7a0ff', yellow: '#ffe08a', red: '#ec5a4c',
    blue: '#6f9fe0', crimson: '#b8302a', paper: '#f6efe0',
  };

  // ---------- math utils ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = {
    out: t => 1 - Math.pow(1 - clamp(t), 3),
    inOut: t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    back: t => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: t => { t = clamp(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
  };
  // progress of an animation starting at `start` lasting `dur`
  const prog = (t, start, dur = 0.6) => clamp((t - start) / dur);
  // deterministic pseudo random
  function rng(seed) { let s = (Math.imul(seed + 0x9e37, 2654435761) ^ 0x5bd1e995) >>> 0 || 1; for (let i = 0; i < 5; i++) s = (s * 1664525 + 1013904223) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function softmax(xs) { const m = Math.max(...xs); const e = xs.map(x => Math.exp(x - m)); const s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function mix(h1, h2, t) {
    const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
    const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
    const bl = Math.round(lerp(a & 255, b & 255, t));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  // perceptual-ish heat colour 0..1 : navy → purple → pink → amber → pale yellow
  const HEAT = ['#2a1216', '#6b1f26', '#b8302a', '#e8893a', '#ffe8a3'];
  function heat(v) {
    v = clamp(v); const s = v * (HEAT.length - 1); const i = Math.min(HEAT.length - 2, Math.floor(s));
    return mix(HEAT[i], HEAT[i + 1], s - i);
  }
  // diverging colour for signed vector values
  function signed(v) { v = clamp(v, -1, 1); return v >= 0 ? mix('#3a1a1e', '#ffb347', v) : mix('#3a1a1e', '#4cc9f0', -v); }

  // ---------- drawing primitives ----------
  function makeDraw(ctx) {
    const D = { ctx, W, H, C, FONT, MONO, MATH, MAIN };

    D.font = (size, weight = 400, fam = FONT) => { ctx.font = `${weight} ${size}px ${fam}`; };

    D.text = (s, x, y, o = {}) => {
      const { size = 40, color = C.text, align = 'center', weight = 400, alpha = 1, fam = FONT, base = 'middle', glow = 0 } = o;
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      D.font(size, weight, fam);
      ctx.textAlign = align; ctx.textBaseline = base;
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
      ctx.fillStyle = color;
      ctx.fillText(s, x, y);
      ctx.restore();
    };
    D.measure = (s, size = 40, weight = 400, fam = FONT) => { D.font(size, weight, fam); return ctx.measureText(s).width; };

    // rich inline text: segments [{s, color, fam, size, weight, dy}] laid out on a baseline
    D.rich = (segs, x, y, o = {}) => {
      const { size = 48, align = 'center', alpha = 1 } = o;
      let total = 0;
      const ws = segs.map(g => { const w = D.measure(g.s, g.size || size, g.weight || 400, g.fam || FONT); total += w + (g.gap || 0); return w; });
      let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
      segs.forEach((g, i) => {
        D.text(g.s, cx, y + (g.dy || 0), { size: g.size || size, color: g.color || C.text, fam: g.fam || FONT, weight: g.weight || 400, align: 'left', alpha: alpha * (g.alpha ?? 1) });
        cx += ws[i] + (g.gap || 0);
      });
      return total;
    };

    D.rrect = (x, y, w, h, r = 16) => {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    D.box = (x, y, w, h, o = {}) => {
      const { r = 16, fill = null, stroke = null, lw = 2, alpha = 1, glow = 0 } = o;
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha *= alpha;
      D.rrect(x, y, w, h, r);
      if (glow && stroke) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
      ctx.restore();
    };

    // token chip centred at (x,y)
    D.chip = (s, x, y, o = {}) => {
      const { color = C.blue, size = 40, alpha = 1, scale = 1, fill = 0.18, pad = 26, h = size * 1.7, textColor = C.text, glow = 0, weight = 500 } = o;
      if (alpha <= 0) return 0;
      const w = D.measure(s, size, weight) + pad * 2;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(scale, scale);
      D.box(-w / 2, -h / 2, w, h, { r: h / 2.6, fill: hexA(color, fill), stroke: color, lw: 2.5, glow });
      D.text(s, 0, 2, { size, color: textColor, weight });
      ctx.restore();
      return w * scale;
    };

    D.line = (x1, y1, x2, y2, o = {}) => {
      const { color = C.dim, lw = 3, alpha = 1, dash = null, cap = 'round' } = o;
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = cap;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    };
    D.arrowHead = (x, y, ang, size, color) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.55); ctx.lineTo(-size * 0.75, 0); ctx.lineTo(-size, size * 0.55); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    // arrow with partial draw progress p (0..1)
    D.arrow = (x1, y1, x2, y2, o = {}) => {
      const { color = C.text, lw = 4, alpha = 1, p = 1, head = 18, dash = null } = o;
      if (alpha <= 0 || p <= 0) return;
      const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.save(); ctx.globalAlpha *= alpha;
      D.line(x1, y1, ex - Math.cos(ang) * head * 0.6, ey - Math.sin(ang) * head * 0.6, { color, lw, dash });
      D.arrowHead(ex, ey, ang, head, color);
      ctx.restore();
    };
    // quadratic curved arrow (bend = perpendicular offset) with draw progress
    D.curve = (x1, y1, x2, y2, bend, o = {}) => {
      const { color = C.text, lw = 4, alpha = 1, p = 1, head = 16 } = o;
      if (alpha <= 0 || p <= 0) return;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const cx = mx - dy / len * bend, cy = my + dx / len * bend;
      const pt = s => [(1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2, (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2];
      ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1);
      const N = 40; for (let i = 1; i <= N * p; i++) { const [px, py] = pt(i / N); ctx.lineTo(px, py); }
      ctx.stroke();
      if (head) { const [ax, ay] = pt(p), [bx, by] = pt(Math.max(0, p - 0.03)); D.arrowHead(ax, ay, Math.atan2(ay - by, ax - bx), head, color); }
      ctx.restore();
    };
    D.circle = (x, y, r, o = {}) => {
      const { fill = null, stroke = null, lw = 2, alpha = 1, glow = 0 } = o;
      if (alpha <= 0 || r <= 0) return;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (glow) { ctx.shadowColor = fill || stroke; ctx.shadowBlur = glow; }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
      ctx.restore();
    };

    // vector drawn as a column/row of coloured cells. vals in [-1,1]
    D.vec = (vals, x, y, o = {}) => {
      const { cell = 34, dir = 'row', alpha = 1, p = 1, numbers = false, border = C.faint, label = null, labelColor = C.text, cmap = signed, gap = 3 } = o;
      if (alpha <= 0) return;
      const n = vals.length, shown = Math.ceil(n * clamp(p));
      for (let i = 0; i < shown; i++) {
        const cx = dir === 'row' ? x + i * (cell + gap) : x;
        const cy = dir === 'row' ? y : y + i * (cell + gap);
        D.box(cx, cy, cell, cell, { r: 5, fill: cmap(vals[i]), stroke: border, lw: 1.5, alpha });
        if (numbers) D.text(vals[i].toFixed(1), cx + cell / 2, cy + cell / 2 + 1, { size: cell * 0.36, fam: MONO, alpha, color: '#fff' });
      }
      if (label) {
        const lx = dir === 'row' ? x - 16 : x + cell / 2, ly = dir === 'row' ? y + cell / 2 : y - 24;
        D.text(label, lx, ly, { size: 30, align: dir === 'row' ? 'right' : 'center', color: labelColor, alpha, weight: 700, fam: MATH });
      }
    };

    // Grid of numbers / heat cells
    D.matrix = (M, x, y, o = {}) => {
      const { cell = 60, alpha = 1, cmap = heat, numbers = true, digits = 2, reveal = 1, textSize = cell * 0.3, rowP = null } = o;
      const R = M.length, Cc = M[0].length;
      for (let i = 0; i < R; i++) for (let j = 0; j < Cc; j++) {
        const k = i * Cc + j;
        let a = clamp(reveal * R * Cc - k);
        if (rowP) a = clamp(rowP(i, j));
        if (a <= 0) continue;
        const v = M[i][j];
        if (v === null) { D.box(x + j * cell + 2, y + i * cell + 2, cell - 4, cell - 4, { r: 6, fill: '#0c1128', stroke: '#1d2550', lw: 1, alpha: alpha * a }); continue; }
        D.box(x + j * cell + 2, y + i * cell + 2, cell - 4, cell - 4, { r: 6, fill: cmap(v), alpha: alpha * a });
        if (numbers) D.text(v.toFixed(digits), x + j * cell + cell / 2, y + i * cell + cell / 2 + 1, { size: textSize, fam: MONO, alpha: alpha * a, color: v > 0.6 ? '#1a1030' : '#fff' });
      }
    };

    // Bracketed matrix brackets for math look
    D.brackets = (x, y, w, h, o = {}) => {
      const { color = C.text, lw = 3, alpha = 1, arm = 12 } = o;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x + arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + arm, y + h);
      ctx.moveTo(x + w - arm, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - arm, y + h); ctx.stroke();
      ctx.restore();
    };

    // wrap CJK/latin text into lines not exceeding maxW
    D.wrap = (s, maxW, size, weight = 400) => {
      D.font(size, weight);
      const out = []; let cur = '';
      const units = s.match(/[A-Za-z0-9.\-'’]+|\s+|./gu) || [];
      for (const u of units) {
        const t = cur + u;
        if (ctx.measureText(t).width > maxW && cur.trim()) {
          // avoid line-leading punctuation
          if (/^[，。！？、；：”）》,.!?]$/.test(u)) { out.push(t); cur = ''; continue; }
          out.push(cur); cur = u.trimStart();
        } else cur = t;
      }
      if (cur.trim()) out.push(cur);
      return out;
    };
    D.para = (s, x, y, o = {}) => {
      const { size = 40, maxW = 1400, lh = 1.5, ...rest } = o;
      const lines = D.wrap(s, maxW, size, rest.weight);
      lines.forEach((l, i) => D.text(l, x, y + i * size * lh, { size, ...rest }));
      return lines.length * size * lh;
    };

    return D;
  }

  // ---------- timeline ----------
  // SCENES: [{ id, chapter?, lines:[string|{t,s}], lead?, tail?, draw(D,t,S) }]
  // TIMING: { lines: { "<scene>:<i>": seconds } } produced by tools/build_audio.py
  const GAP = 0.45, LEAD = 0.9, TAIL = 1.1, CHAPTER_LEAD = 2.6;
  function buildTimeline(scenes, timing) {
    let t0 = 0; const out = [];
    for (const sc of scenes) {
      const lead = sc.lead ?? (sc.chapter ? CHAPTER_LEAD : LEAD);
      const cues = [], durs = [];
      let t = lead;
      sc.lines.forEach((ln, i) => {
        const d = (timing && timing.lines[`${sc.id}:${i}`]) || estimate(typeof ln === 'string' ? ln : ln.t);
        cues.push(t); durs.push(d); t += d + GAP + (typeof ln === 'object' && ln.pause ? ln.pause : 0);
      });
      const dur = t - GAP + (sc.tail ?? TAIL);
      out.push({ scene: sc, start: t0, dur, cues, durs });
      t0 += dur;
    }
    return { items: out, total: t0 };
  }
  function estimate(s) { return Math.max(1.5, s.replace(/\s/g, '').length * 0.23); }

  window.ENGINE = { W, H, C, FONT, MONO, MATH, MAIN, clamp, lerp, ease, prog, rng, softmax, hexA, mix, heat, signed, makeDraw, buildTimeline };
})();
