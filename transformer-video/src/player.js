// Composes the whole video frame at time t: background → scene → chapter card → subtitles → progress.
(function () {
  const E = window.ENGINE;
  const { W, H: HH, C, clamp, lerp, ease, prog, hexA, rng, MONO } = E;

  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = HH;
  const ctx = canvas.getContext('2d');
  const D = E.makeDraw(ctx);
  let TL = E.buildTimeline(window.SCENES, window.TIMING);

  // static background layer
  const bg = document.createElement('canvas'); bg.width = W; bg.height = HH;
  (function paintBg() {
    const b = bg.getContext('2d');
    const g = b.createRadialGradient(W * 0.5, HH * 0.35, 100, W * 0.5, HH * 0.5, W * 0.75);
    g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0);
    b.fillStyle = g; b.fillRect(0, 0, W, HH);
    b.strokeStyle = 'rgba(120,140,255,0.045)'; b.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, HH); b.stroke(); }
    for (let y = 0; y <= HH; y += 60) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
  })();
  const R = rng(7);
  const dust = Array.from({ length: 90 }, () => ({ x: R() * W, y: R() * HH, r: 0.6 + R() * 2.2, vx: (R() - 0.5) * 12, vy: -4 - R() * 10, tw: R() * 6.28, c: [C.k, C.q, C.purple, C.text][Math.floor(R() * 4)] }));

  function background(t) {
    ctx.drawImage(bg, 0, 0);
    for (const p of dust) {
      const x = ((p.x + p.vx * t) % W + W) % W, y = ((p.y + p.vy * t) % HH + HH) % HH;
      D.circle(x, y, p.r, { fill: p.c, alpha: 0.18 + 0.18 * Math.sin(t * 1.3 + p.tw) });
    }
  }

  function chapterCard(item, local) {
    const ch = item.scene.chapter; if (!ch) return;
    const inP = ease.out(prog(local, 0.05, 0.7));
    const outP = ease.inOut(prog(local, 1.9, 0.7));
    // big centered card
    if (outP < 1) {
      const a = inP * (1 - outP);
      const y = HH / 2 - 40 - outP * 60;
      D.text(String(ch.n).padStart(2, '0'), W / 2, y - 90, { size: 150, weight: 900, fam: MONO, color: hexA(C.q, 0.9), alpha: a, glow: 30 });
      D.text(ch.title, W / 2, y + 60, { size: 76, weight: 900, alpha: a });
      if (ch.sub) D.text(ch.sub, W / 2, y + 140, { size: 36, color: C.dim, alpha: a });
      const lw = 520 * inP;
      D.line(W / 2 - lw / 2, y - 5, W / 2 + lw / 2, y - 5, { color: C.q, lw: 4, alpha: a });
    }
    // persistent corner label
    const cA = ease.out(prog(local, 2.3, 0.6)) * (1 - prog(local, item.dur - 0.6, 0.5));
    if (cA > 0) {
      D.text(String(ch.n).padStart(2, '0'), 60, 58, { size: 30, weight: 900, fam: MONO, color: C.q, align: 'left', alpha: cA });
      D.text(ch.title, 112, 58, { size: 28, weight: 700, color: C.dim, align: 'left', alpha: cA });
    }
  }

  function subtitles(item, local) {
    const sc = item.scene;
    for (let i = 0; i < item.cues.length; i++) {
      const a0 = item.cues[i] - 0.12, a1 = item.cues[i] + item.durs[i] + 0.3;
      if (local < a0 || local > a1) continue;
      const ln = sc.lines[i]; const s = typeof ln === 'string' ? ln : ln.t;
      const a = clamp((local - a0) / 0.15) * clamp((a1 - local) / 0.15);
      const lines = D.wrap(s, 1500, 38, 500);
      const lh = 54, h = lines.length * lh + 26, y0 = HH - 40 - h;
      let mw = 0; lines.forEach(l => mw = Math.max(mw, D.measure(l, 38, 500)));
      D.box(W / 2 - mw / 2 - 30, y0, mw + 60, h, { r: 18, fill: 'rgba(5,8,20,0.72)', alpha: a });
      lines.forEach((l, k) => D.text(l, W / 2, y0 + 13 + lh / 2 + k * lh, { size: 38, weight: 500, alpha: a, color: '#f4f6ff' }));
    }
  }

  function progress(t) {
    const y = 6;
    D.line(0, y, W, y, { color: 'rgba(255,255,255,0.08)', lw: 4, cap: 'butt' });
    D.line(0, y, W * t / TL.total, y, { color: C.q, lw: 4, cap: 'butt', alpha: 0.85 });
    for (const it of TL.items) if (it.scene.chapter) D.circle(W * it.start / TL.total, y, 5, { fill: t >= it.start ? C.q : '#556' });
  }

  function renderAt(t) {
    t = clamp(t, 0, TL.total - 1e-3);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    background(t);
    const item = TL.items.find(it => t >= it.start && t < it.start + it.dur) || TL.items[TL.items.length - 1];
    const local = t - item.start;
    const S = {
      t: local, dur: item.dur, cues: item.cues,
      cue: i => item.cues[i], d: i => item.durs[i],
      end: i => item.cues[i] + item.durs[i],
      p: (i, delay = 0, len = 0.8, e = ease.out) => e(prog(local, item.cues[i] + delay, len)),
      raw: (i, delay = 0, len = 0.8) => prog(local, item.cues[i] + delay, len),
      // 1 until line i starts, then fades to 0
      gone: (i, delay = 0, len = 0.5) => 1 - ease.inOut(prog(local, item.cues[i] + delay, len)),
    };
    ctx.save();
    ctx.globalAlpha = clamp(local / 0.45) * clamp((item.dur - local) / 0.45);
    try { item.scene.draw(D, local, S); } catch (e) { console.error(item.scene.id, e); D.text('ERR ' + item.scene.id + ': ' + e.message, W / 2, 100, { color: 'red', size: 30 }); }
    ctx.restore();
    ctx.globalAlpha = 1;
    chapterCard(item, local);
    subtitles(item, local);
    progress(t);
  }

  window.PLAYER = {
    canvas, renderAt,
    get total() { return TL.total; },
    get timeline() { return TL; },
    retime(timing) { window.TIMING = timing; TL = E.buildTimeline(window.SCENES, timing); },
    sceneStart(id) { const it = TL.items.find(i => i.scene.id === id); return it ? it.start : 0; },
  };
})();
