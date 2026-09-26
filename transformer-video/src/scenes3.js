// Scenes: positional encoding, feed-forward & residual, stacking & output, training, finale.
(function () {
  const E = window.ENGINE, Hh = window.H;
  const { C, clamp, lerp, ease, prog, hexA, MONO, MATH, MAIN, rng, softmax } = E;
  const add = s => window.SCENES.push(s);
  const col = c => z => E.mix('#1c2450', c, (z + 1) / 2);

  // ------------------------------------------------------------------ ch8 positional encoding
  const PE = (pos, i, d = 64) => (i % 2 === 0 ? Math.sin : Math.cos)(pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d));
  add({
    id: 'pos', chapter: { n: 8, title: '位置编码', sub: '谁先谁后，也很重要' },
    lines: [
      '等一下！注意力机制有一个大漏洞：它根本不关心词的顺序。',
      '"狗咬人"和"人咬狗"，用的是同样三个词。在注意力看来，它们就像一袋打乱的积木，完全一样。可意思却天差地别！',
      '解决办法是：给每个位置也准备一个向量，直接加到词向量上。这叫做"位置编码"。',
      '原始论文用的是正弦和余弦波：每一维对应一条频率不同的波，有的变化很快，有的变化很慢，就像钟表上的秒针、分针和时针。',
      '把所有波在某个位置上的取值组合起来，每个位置就拥有了一个独一无二的"指纹"。',
    ],
    draw(D, t, S) {
      // warning
      const wA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.5);
      if (wA > 0) {
        const s = 1 + 0.04 * Math.sin(t * 6);
        const ctx = D.ctx; ctx.save(); ctx.translate(960, 400); ctx.scale(s, s); ctx.globalAlpha *= wA;
        ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(150, 120); ctx.lineTo(-150, 120); ctx.closePath();
        ctx.fillStyle = hexA(C.yellow, 0.18); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.yellow; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
        D.text('!', 960, 430, { size: 150, weight: 900, color: C.yellow, alpha: wA });
        D.text('注意力 不看 顺序', 960, 650, { size: 70, weight: 900, alpha: wA * S.p(0, 0.8, 0.6) });
      }
      // dog bites man
      const dA = S.p(1, 0, 0.5) * S.gone(2, 0, 0.6);
      if (dA > 0) {
        const bag = S.p(1, 3.2, 1.2, ease.inOut);
        [['狗', '咬', '人'], ['人', '咬', '狗']].forEach((ws, k) => {
          const cx = k ? 1340 : 580;
          const L = Hh.rowX(D, ws, cx, { size: 60, gap: 30 });
          D.text(k ? '人咬狗：大新闻！' : '狗咬人：很平常', cx, 250, { size: 44, weight: 900, color: k ? C.red : C.v, alpha: dA * S.p(1, 1.0 + k * 0.6, 0.5) });
          // bag
          D.box(cx - 200, 520, 400, 260, { r: 60, fill: hexA(C.purple, 0.15), stroke: C.purple, lw: 3, alpha: dA * bag });
          ws.forEach((w, i) => {
            const R = rng(k * 10 + ['狗', '咬', '人'].indexOf(w));
            const bx = cx - 110 + ['狗', '咬', '人'].indexOf(w) * 110, by = 650 + (R() - 0.5) * 60;
            const x = lerp(L.xs[i], bx, bag), y = lerp(380, by, bag);
            const ctx = D.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(bag * (R() - 0.5) * 0.8);
            D.chip(w, 0, 0, { size: 60, color: C.blue, alpha: dA * S.p(1, 0.2 + i * 0.15, 0.4) }); ctx.restore();
          });
        });
        const eq = S.p(1, 4.6, 0.5);
        D.text('=', 960, 650, { size: 110, weight: 900, color: C.yellow, alpha: dA * eq, fam: MAIN });
        D.text('在注意力眼里一模一样', 960, 850, { size: 40, weight: 700, color: C.yellow, alpha: dA * S.p(1, 5.0, 0.5) });
      }
      // word + pos = input
      const aA = S.p(2, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (aA > 0) {
        const R = rng(8); const wv = Array.from({ length: 8 }, () => R() * 2 - 1);
        [0, 2].forEach((pos, k) => {
          const y = 330 + k * 250, p = S.p(2, 0.6 + k * 1.4, 0.6);
          const pv = Array.from({ length: 8 }, (_, i) => PE(pos, i, 8));
          const sum = wv.map((v, i) => clamp((v + pv[i]) / 1.6, -1, 1));
          D.chip('狗', 190, y + 20, { size: 44, color: C.blue, alpha: aA * p });
          D.text(`位置 ${pos}`, 190, y + 95, { size: 28, color: C.dim, alpha: aA * p, fam: MONO });
          D.vec(wv, 300, y, { cell: 40, alpha: aA * p });
          D.text('词向量', 300 + 4 * 43, y - 34, { size: 26, color: C.dim, alpha: aA * p });
          D.text('+', 670, y + 20, { size: 60, fam: MAIN, alpha: aA * p });
          D.vec(pv, 720, y, { cell: 40, alpha: aA * p, cmap: col(C.pink) });
          D.text(`位置 ${pos} 的编码`, 720 + 4 * 43, y - 34, { size: 26, color: C.pink, alpha: aA * p });
          D.text('=', 1090, y + 20, { size: 60, fam: MAIN, alpha: aA * p });
          D.vec(sum, 1140, y, { cell: 40, alpha: aA * p, cmap: col(C.q) });
          D.text('送进 Transformer', 1140 + 4 * 43, y - 34, { size: 26, color: C.q, alpha: aA * p });
        });
        D.text('同一个"狗"，站在不同位置，向量就不同了', 960, 830, { size: 40, weight: 700, color: C.yellow, alpha: aA * S.p(2, 3.4, 0.6) });
      }
      // waves + clock
      const vA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (vA > 0) {
        const oms = [1.0, 0.5, 0.25, 0.125, 0.0625];
        const x0 = 180, x1 = 1180, ppx = 25; // px per position
        const scan = lerp(0, 38, ease.inOut(S.raw(3, 1.5, Math.max(3, S.d(3) - 1.5))));
        oms.forEach((om, k) => {
          const y = 250 + k * 125, a = S.p(3, 0.4 + k * 0.25, 0.5) * vA;
          const colr = [C.pink, C.q, C.yellow, C.v, C.k][k];
          const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = colr; ctx.lineWidth = 3.5; ctx.beginPath();
          for (let x = x0; x <= x1; x += 3) { const pos = (x - x0) / ppx; const yy = y - Math.sin(pos * om) * 45; x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
          ctx.stroke(); ctx.restore();
          D.text(`第 ${k * 2} 维`, x0 - 20, y, { size: 24, color: colr, align: 'right', alpha: a });
          const sx = x0 + scan * ppx, sy = y - Math.sin(scan * om) * 45;
          D.circle(sx, sy, 9, { fill: colr, alpha: a, glow: 10 });
          D.text(Math.sin(scan * om).toFixed(2), sx + 16, sy - 18, { size: 22, fam: MONO, align: 'left', alpha: a * 0.9 });
        });
        D.line(x0 + scan * ppx, 185, x0 + scan * ppx, 820, { color: C.text, lw: 2, alpha: vA * 0.5, dash: [8, 8] });
        D.text(`位置 = ${Math.round(scan)}`, x0 + scan * ppx, 855, { size: 30, fam: MONO, alpha: vA, color: C.text });
        D.text('快', x1 + 30, 250, { size: 28, color: C.pink, alpha: vA, align: 'left' });
        D.text('慢', x1 + 30, 750, { size: 28, color: C.k, alpha: vA, align: 'left' });
        // clock
        const cx = 1560, cy = 480, r = 210, ca = S.p(3, 3.0, 0.6) * vA;
        D.circle(cx, cy, r, { fill: 'rgba(15,20,48,0.9)', stroke: C.dim, lw: 4, alpha: ca });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; D.line(cx + Math.cos(a) * (r - 20), cy + Math.sin(a) * (r - 20), cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6), { color: C.dim, lw: 3, alpha: ca }); }
        [[1.0, 0.9, C.pink, 3, '秒针'], [0.25, 0.7, C.yellow, 6, '分针'], [0.0625, 0.5, C.k, 9, '时针']].forEach(([om, len, c2, lw]) => {
          const a = scan * om - Math.PI / 2;
          D.line(cx, cy, cx + Math.cos(a) * r * len, cy + Math.sin(a) * r * len, { color: c2, lw, alpha: ca });
        });
        D.circle(cx, cy, 10, { fill: C.text, alpha: ca });
        D.text('每根指针转速不同 → 组合起来就能标记时刻', cx, cy + r + 60, { size: 26, color: C.dim, alpha: ca });
      }
      // fingerprint heatmap
      const hA = S.p(4, 0.2, 0.6);
      if (hA > 0) {
        const rows = 40, cols = 64, cs = 11, gx = 250, gy = 250;
        const rev = S.raw(4, 0.3, 1.5);
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= hA;
        for (let p = 0; p < rows; p++) { if (p / rows > rev) break; for (let i = 0; i < cols; i++) { ctx.fillStyle = E.signed(PE(p, i)); ctx.fillRect(gx + i * cs, gy + p * cs, cs - 1, cs - 1); } }
        ctx.restore();
        D.text('维度 →', gx + cols * cs / 2, gy - 30, { size: 28, color: C.dim, alpha: hA });
        const c2 = D.ctx; c2.save(); c2.translate(gx - 40, gy + rows * cs / 2); c2.rotate(-Math.PI / 2); D.text('位置 →', 0, 0, { size: 28, color: C.dim, alpha: hA }); c2.restore();
        const hp = 17, hl = S.p(4, 2.0, 0.6);
        D.box(gx - 4, gy + hp * cs - 3, cols * cs + 8, cs + 6, { r: 3, stroke: C.yellow, lw: 3, alpha: hA * hl, glow: 10 });
        D.arrow(gx + cols * cs + 10, gy + hp * cs + 5, 1100, 560, { color: C.yellow, lw: 3, alpha: hA * hl });
        for (let i = 0; i < 32; i++) D.box(1110 + (i % 16) * 44, 520 + Math.floor(i / 16) * 44, 40, 40, { r: 6, fill: E.signed(PE(hp, i)), alpha: hA * hl });
        D.text('位置 17 的"指纹"', 1460, 480, { size: 34, weight: 700, color: C.yellow, alpha: hA * hl });
        Hh.formula(D, [{ s: 'PE', fam: MAIN }, '(', { s: 'pos', fam: MATH }, ', 2', { s: 'i', fam: MATH }, ') = sin', { num: [{ s: 'pos', fam: MATH }], den: [{ sup: [{ s: '2i/d', fam: MATH }], base: ['10000'] }] }], 1460, 330, { size: 44, alpha: hA * S.p(4, 1.0, 0.6) });
        D.text('奇数维用 cos，偶数维用 sin', 1460, 700, { size: 28, color: C.dim, alpha: hA * S.p(4, 3.0, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch9 feed-forward + residual
  add({
    id: 'ffn', chapter: { n: 9, title: '前馈网络与残差', sub: '交流之后，各自思考' },
    lines: [
      '注意力让词和词之间互相交流。交流完之后，每个词还要自己"消化思考"一下，这一步叫做前馈神经网络。',
      '它由两层神经元组成：先把向量放大到原来的四倍宽，经过一个激活函数，再压缩回原来的大小。',
      '原始论文用的激活函数叫 ReLU，规则非常简单：负数变成零，正数保持不变。正是这种"弯折"，让网络能够表达复杂的规律。',
      '研究者发现，模型学到的大量知识，比如"巴黎是法国的首都"，很可能就储存在这些前馈层里。',
      '另外还有两个小技巧：一个是残差连接，把输入直接加到输出上，像修了一条高速公路，让信息畅通无阻；另一个是层归一化，让数字保持在合适的范围。',
    ],
    draw(D, t, S) {
      // independent processing
      const iA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.6);
      if (iA > 0) {
        const ws = ['小猫', '坐', '在', '垫子'];
        const xs = [480, 800, 1120, 1440];
        const talk = 1 - S.p(0, 3.0, 0.8);
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) D.curve(xs[i], 690, xs[j], 690, -(j - i) * 40, { color: C.k, lw: 3, head: 0, alpha: iA * talk * 0.8 });
        D.text('注意力：互相交流', 960, 520, { size: 40, color: C.k, weight: 700, alpha: iA * talk });
        const fp = S.p(0, 3.4, 0.8);
        ws.forEach((w, i) => {
          D.chip(w, xs[i], 740, { size: 40, alpha: iA });
          D.arrow(xs[i], 700, xs[i], 560, { color: C.purple, lw: 3, alpha: iA * fp, p: fp });
          D.box(xs[i] - 110, 380, 220, 170, { r: 20, fill: hexA(C.purple, 0.18), stroke: C.purple, lw: 3, alpha: iA * fp });
          D.text('前馈网络', xs[i], 440, { size: 32, weight: 700, color: C.purple, alpha: iA * fp });
          Hh.brain(D, xs[i], 500, 28, iA * fp);
        });
        D.text('前馈网络：各自独立思考（每个词用同一套参数）', 960, 280, { size: 40, weight: 700, color: C.purple, alpha: iA * S.p(0, 4.0, 0.6) });
      }
      // network
      const nA = S.p(1, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (nA > 0) {
        const shift = S.p(2, 0, 0.8, ease.inOut);
        const x = lerp(560, 260, shift);
        const pulse = ((t - S.cue(1)) * 0.5) % 1;
        const act = (li, i) => li === 1 ? (Math.sin(i * 2.3 + 1) > 0.1 ? 0.9 : 0.05) : 0.6;
        Hh.net(D, [4, 16, 4], x, 220, 700, 560, { alpha: nA, pulse, act, r: 14 });
        D.text('d', x, 850, { size: 40, fam: MATH, alpha: nA });
        D.text('4d', x + 350, 850, { size: 40, fam: MATH, color: C.purple, alpha: nA });
        D.text('d', x + 700, 850, { size: 40, fam: MATH, alpha: nA });
        D.text('放大', x + 175, 180, { size: 30, color: C.dim, alpha: nA * S.p(1, 1.2, 0.5) });
        D.text('激活', x + 350, 180, { size: 30, color: C.yellow, alpha: nA * S.p(1, 2.4, 0.5) });
        D.text('压缩', x + 525, 180, { size: 30, color: C.dim, alpha: nA * S.p(1, 3.2, 0.5) });
        // relu
        const rA = S.p(2, 0.6, 0.6) * nA;
        if (rA > 0) {
          const ox = 1450, oy = 560, u = 70;
          D.line(ox - 4 * u, oy, ox + 4 * u, oy, { color: C.dim, lw: 2, alpha: rA });
          D.line(ox, oy + 2.2 * u, ox, oy - 4 * u, { color: C.dim, lw: 2, alpha: rA });
          const dp = S.raw(2, 1.2, 1.2);
          const ex = lerp(-4, 3.6, dp);
          D.line(ox - 4 * u, oy, ox + Math.min(0, ex) * u, oy, { color: C.yellow, lw: 7, alpha: rA });
          if (ex > 0) D.line(ox, oy, ox + ex * u, oy - ex * u, { color: C.yellow, lw: 7, alpha: rA });
          Hh.formula(D, ['ReLU(', { s: 'x', fam: MATH }, ') = max(0, ', { s: 'x', fam: MATH }, ')'], ox, 230, { size: 48, alpha: rA });
          const probe = Math.sin((t - S.cue(2)) * 1.2) * 3;
          D.circle(ox + probe * u, oy - Math.max(0, probe) * u, 12, { fill: C.pink, alpha: rA * S.p(2, 2.6, 0.5), glow: 12 });
          D.text(`${probe.toFixed(1)} → ${Math.max(0, probe).toFixed(1)}`, ox + 150, oy + 120, { size: 32, fam: MONO, alpha: rA * S.p(2, 2.6, 0.5), color: C.pink });
          D.text('负数 → 0', ox - 2 * u, oy + 50, { size: 28, color: C.dim, alpha: rA });
          D.text('正数不变', ox - 1.6 * u, oy - 3 * u, { size: 28, color: C.dim, alpha: rA });
        }
      }
      // knowledge
      const kA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (kA > 0) {
        D.chip('巴黎', 260, 520, { size: 52, color: C.k, alpha: kA });
        D.arrow(340, 520, 480, 520, { color: C.dim, lw: 4, alpha: kA });
        const pulse = ((t - S.cue(3)) * 0.45) % 1;
        const fire = S.p(3, 1.4, 0.4);
        Hh.net(D, [5, 14, 5], 540, 280, 640, 480, { alpha: kA, pulse, r: 13, act: (li, i) => li === 1 && (i === 4 || i === 9) ? fire : li === 1 ? 0.08 : 0.4 });
        const facts = [['首都', C.q], ['法国', C.v], ['埃菲尔铁塔', C.pink], ['塞纳河', C.k]];
        facts.forEach(([f, c2], i) => {
          const p = S.p(3, 2.0 + i * 0.4, 0.6);
          D.arrow(1200, 520, 1340, 330 + i * 120, { color: c2, lw: 3, alpha: kA * p, p });
          D.chip(f, 1480, 330 + i * 120, { size: 40, color: c2, alpha: kA * p });
        });
        D.text('某些神经元像"记忆开关"：看到"巴黎"就被激活，补充相关知识', 960, 850, { size: 34, color: C.dim, alpha: kA * S.p(3, 3.2, 0.6) });
      }
      // residual + layernorm
      const rA = S.p(4, 0.2, 0.6);
      if (rA > 0) {
        const cx = 700;
        D.chip('输入 x', cx, 830, { size: 36, color: C.blue, alpha: rA });
        D.box(cx - 170, 520, 340, 120, { r: 20, fill: hexA(C.purple, 0.2), stroke: C.purple, lw: 3, alpha: rA });
        D.text('注意力 / 前馈', cx, 580, { size: 38, weight: 700, color: C.purple, alpha: rA });
        D.arrow(cx, 795, cx, 645, { color: C.text, lw: 4, alpha: rA });
        D.circle(cx, 440, 34, { fill: hexA(C.q, 0.2), stroke: C.q, lw: 3, alpha: rA });
        D.text('+', cx, 442, { size: 50, weight: 900, color: C.q, alpha: rA });
        D.arrow(cx, 518, cx, 476, { color: C.text, lw: 4, alpha: rA });
        // highway
        const hp = S.p(4, 1.4, 1.0);
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= rA * hp; ctx.strokeStyle = C.q; ctx.lineWidth = 8; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(cx + 80, 830); ctx.lineTo(cx + 300, 830); ctx.lineTo(cx + 300, 440); ctx.lineTo(cx + 40, 440); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha *= rA * hp; D.arrowHead(cx + 36, 440, Math.PI, 22, C.q); ctx.restore();
        const car = ((t - S.cue(4)) * 0.6) % 1;
        const path = [[cx + 80, 830], [cx + 300, 830], [cx + 300, 440], [cx + 40, 440]];
        const segL = [220, 390, 260], tot = 870; let dd = car * tot, k = 0; while (k < 2 && dd > segL[k]) { dd -= segL[k]; k++; }
        const px = lerp(path[k][0], path[k + 1][0], dd / segL[k]), py = lerp(path[k][1], path[k + 1][1], dd / segL[k]);
        D.circle(px, py, 12, { fill: C.yellow, alpha: rA * hp, glow: 14 });
        D.text('残差连接（高速公路）', cx + 330, 640, { size: 34, weight: 700, color: C.q, align: 'left', alpha: rA * hp });
        D.box(cx - 170, 250, 340, 100, { r: 20, fill: hexA(C.v, 0.18), stroke: C.v, lw: 3, alpha: rA * S.p(4, 4.0, 0.6) });
        D.text('层归一化', cx, 300, { size: 38, weight: 700, color: C.v, alpha: rA * S.p(4, 4.0, 0.6) });
        D.arrow(cx, 406, cx, 355, { color: C.text, lw: 4, alpha: rA * S.p(4, 4.0, 0.6) });
        D.arrow(cx, 248, cx, 190, { color: C.text, lw: 4, alpha: rA * S.p(4, 4.3, 0.6) });
        Hh.formula(D, ['输出 = LayerNorm(', { s: 'x', fam: MATH }, ' + ', { s: 'F', fam: MATH, color: C.purple }, '(', { s: 'x', fam: MATH }, '))'], 1440, 420, { size: 44, alpha: rA * S.p(4, 2.0, 0.6) });
        D.text('即使 F 什么都没学会，信息也能原样通过', 1440, 500, { size: 28, color: C.dim, alpha: rA * S.p(4, 2.6, 0.6) });
        D.text('让训练几十上百层的深网络成为可能', 1440, 545, { size: 28, color: C.dim, alpha: rA * S.p(4, 3.0, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch10 stack & output
  const BLOCK_PARTS = [['多头注意力', C.pink], ['相加 & 归一化', C.v], ['前馈网络', C.purple], ['相加 & 归一化', C.v]];
  function block(D, cx, cy, w, h, a, o = {}) {
    const { detail = 1 } = o;
    D.box(cx - w / 2, cy - h / 2, w, h, { r: 18 * w / 440, fill: 'rgba(20,28,62,0.9)', stroke: C.q, lw: 3, alpha: a });
    if (detail > 0) {
      const ph = h * 0.17, gap = (h - ph * 4) / 5;
      BLOCK_PARTS.forEach(([n, c2], i) => {
        const y = cy + h / 2 - gap - ph / 2 - i * (ph + gap);
        const small = i % 2 === 1;
        D.box(cx - w * 0.38, y - ph / 2, w * (small ? 0.62 : 0.76), ph, { r: 10, fill: hexA(c2, 0.2), stroke: c2, lw: 2, alpha: a * detail });
        D.text(n, cx - w * 0.38 + w * (small ? 0.31 : 0.38), y + 1, { size: Math.max(12, ph * 0.42), weight: 700, color: c2, alpha: a * detail });
      });
    }
  }
  add({
    id: 'stack', chapter: { n: 10, title: '堆叠起来，输出答案', sub: '从一层到九十六层' },
    lines: [
      '注意力，加上前馈网络，再加上残差和归一化，就组成了一个完整的 Transformer 模块。',
      '然后，把这样的模块一层一层地堆起来：原始论文堆了 6 层，GPT-3 堆了整整 96 层。',
      '越往上，词向量携带的信息就越抽象：底层关注词语搭配和语法，高层则能理解语义、逻辑，甚至语气。',
      '到了最后一层，最后一个词的向量，已经吸收了整句话的信息。把它和词表里的每个词做点积打分，再经过 softmax，就得到了下一个词的概率。',
      '这正好回到了我们开头的游戏：猜下一个词。',
      '顺便一提，原始的 Transformer 是为机器翻译设计的，分为编码器和解码器两部分；而 GPT 只用了其中的解码器。',
    ],
    draw(D, t, S) {
      const bA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.6);
      if (bA > 0) {
        block(D, 960, 520, 520, 600, bA);
        D.text('Transformer 模块', 960, 180, { size: 48, weight: 900, color: C.q, alpha: bA });
        // residual side lines
        D.line(1250, 790, 1250, 580, { color: C.q, lw: 4, alpha: bA * 0.6 }); D.line(1250, 580, 1150, 580, { color: C.q, lw: 4, alpha: bA * 0.6 });
        D.line(1250, 540, 1250, 330, { color: C.q, lw: 4, alpha: bA * 0.6 }); D.line(1250, 330, 1150, 330, { color: C.q, lw: 4, alpha: bA * 0.6 });
        D.text('残差', 1300, 460, { size: 28, color: C.q, alpha: bA, align: 'left' });
        D.arrow(960, 900, 960, 825, { color: C.text, lw: 4, alpha: bA });
        D.text('输入向量（词向量 + 位置编码）', 960, 930, { size: 28, color: C.dim, alpha: bA });
      }
      // tower
      const tA = S.p(1, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (tA > 0) {
        const grow = S.raw(1, 0.8, Math.max(2, S.d(1) - 1));
        const n = grow < 0.35 ? Math.round(lerp(1, 6, grow / 0.35)) : Math.round(lerp(6, 96, (grow - 0.35) / 0.65));
        const shown = Math.max(1, n);
        const cx = 700, bottom = 860, H = 620;
        const lh = Math.min(100, H / shown);
        for (let i = 0; i < shown; i++) {
          const y = bottom - (i + 0.5) * lh;
          const w = 380 - i * 0.6;
          block(D, cx, y, w, Math.max(2, lh - (lh > 8 ? 4 : 1)), tA, { detail: lh > 60 ? 1 : 0 });
        }
        D.text(`× ${shown}`, cx + 300, bottom - H / 2, { size: 90, fam: MONO, weight: 900, color: C.q, alpha: tA, glow: 16 });
        D.text(shown <= 6 ? '原始论文' : 'GPT-3', cx + 300, bottom - H / 2 + 90, { size: 40, weight: 700, alpha: tA });
        // abstraction labels
        const lA = S.p(2, 0.3, 0.6) * tA;
        const lab = [['词语搭配 · 语法', C.k, 0.1], ['语义 · 事实', C.v, 0.5], ['逻辑 · 语气 · 意图', C.q, 0.9]];
        lab.forEach(([s, c2, f], i) => {
          const a = S.p(2, 0.6 + i * 1.2, 0.6) * lA;
          const y = bottom - H * f;
          D.line(cx + 200, y, cx + 520, y, { color: c2, lw: 2, alpha: a, dash: [6, 6] });
          D.text(s, cx + 540, y, { size: 40, weight: 700, color: c2, align: 'left', alpha: a });
        });
        D.arrow(cx + 950, bottom - 40, cx + 950, bottom - H + 40, { color: C.dim, lw: 4, alpha: lA });
        D.text('越来越抽象', cx + 980, bottom - H / 2, { size: 32, color: C.dim, alpha: lA, align: 'left' });
      }
      // output head
      const oA = S.p(3, 0.2, 0.6) * S.gone(5, 0, 0.6);
      if (oA > 0) {
        const R = rng(31); const hv = Array.from({ length: 8 }, () => R() * 2 - 1);
        D.text('最后一个词的向量', 330, 300, { size: 32, weight: 700, color: C.q, alpha: oA });
        D.vec(hv, 330 - 22, 340, { dir: 'col', cell: 44, alpha: oA, cmap: col(C.q) });
        const vocab = [['散步', 5.1], ['玩', 4.6], ['野餐', 4.1], ['跑步', 3.3], ['看花', 3.0], ['……', 1.0]];
        const pr = softmax(vocab.map(v => v[1]));
        D.text('与词表中每个词做点积', 740, 300, { size: 32, weight: 700, color: C.k, alpha: oA * S.p(3, 1.5, 0.6) });
        vocab.forEach(([w, s], i) => {
          const y = 380 + i * 80, a = S.p(3, 1.8 + i * 0.25, 0.5) * oA;
          D.curve(400, 520, 640, y, 0, { color: C.faint, lw: 2, head: 10, alpha: a });
          D.chip(w, 700, y, { size: 32, pad: 18, color: C.k, alpha: a });
          D.text(s.toFixed(1), 860, y, { size: 32, fam: MONO, alpha: a });
          const b = S.p(3, 4.5 + i * 0.1, 0.8);
          D.arrow(920, y, 1060, y, { color: C.faint, lw: 2, head: 10, alpha: a * b });
          D.box(1090, y - 20, 620 * pr[i] * b, 40, { r: 8, fill: i === 0 ? C.q : hexA(C.k, 0.7), alpha: a });
          D.text(`${(pr[i] * 100 * b).toFixed(0)}%`, 1100 + 620 * pr[i] * b, y, { size: 28, fam: MONO, align: 'left', alpha: a * b });
        });
        D.text('softmax →', 990, 250, { size: 32, weight: 700, color: C.pink, alpha: oA * S.p(3, 4.2, 0.6) });
        D.text('下一个词的概率', 1400, 300, { size: 32, weight: 700, color: C.q, alpha: oA * S.p(3, 4.8, 0.6) });
        const gA = S.p(4, 0.3, 0.6);
        if (gA > 0) {
          D.box(1060, 336, 700, 88, { r: 14, stroke: C.q, lw: 4, alpha: oA * gA, glow: 20 });
          D.text('今天天气真好，我们一起去公园 → 散步', 960, 880, { size: 44, weight: 900, color: C.q, alpha: oA * gA, glow: 12 });
        }
      }
      // encoder-decoder
      const eA = S.p(5, 0.2, 0.6);
      if (eA > 0) {
        const dimEnc = 1 - 0.7 * S.p(5, 4.5, 0.8);
        const glowDec = S.p(5, 4.5, 0.8);
        // encoder
        D.box(420, 260, 420, 460, { r: 24, fill: hexA(C.k, 0.1), stroke: C.k, lw: 3, alpha: eA * dimEnc });
        D.text('编码器 Encoder', 630, 310, { size: 38, weight: 900, color: C.k, alpha: eA * dimEnc });
        D.text('读懂原文', 630, 360, { size: 28, color: C.dim, alpha: eA * dimEnc });
        for (let i = 0; i < 3; i++) block(D, 630, 460 + i * 80, 320, 64, eA * dimEnc, { detail: 0 });
        D.text('I  love  you', 630, 790, { size: 40, fam: MAIN, alpha: eA * dimEnc });
        // decoder
        D.box(1080, 260, 420, 460, { r: 24, fill: hexA(C.q, 0.1 + 0.1 * glowDec), stroke: C.q, lw: 3 + 2 * glowDec, alpha: eA, glow: 20 * glowDec });
        D.text('解码器 Decoder', 1290, 310, { size: 38, weight: 900, color: C.q, alpha: eA });
        D.text('逐词写出译文', 1290, 360, { size: 28, color: C.dim, alpha: eA });
        for (let i = 0; i < 3; i++) block(D, 1290, 460 + i * 80, 320, 64, eA, { detail: 0 });
        const tw = Math.floor(clamp((t - S.cue(5) - 1.5) / 2.5) * 3.99);
        D.text(['我', '我 爱', '我 爱 你', '我 爱 你'][tw], 1290, 790, { size: 44, weight: 700, alpha: eA * S.p(5, 1.5, 0.3) });
        const ap = S.p(5, 1.0, 0.8);
        [460, 540, 620].forEach(y => D.arrow(795, y, 1125, y, { color: C.k, lw: 3, head: 12, alpha: eA * dimEnc * ap, p: ap }));
        D.text('原始 Transformer：翻译', 960, 190, { size: 40, weight: 700, alpha: eA * (1 - glowDec) });
        D.text('GPT = 只用解码器', 960, 190, { size: 48, weight: 900, color: C.q, alpha: eA * glowDec, glow: 14 });
      }
    },
  });

  // ------------------------------------------------------------------ ch11 training
  add({
    id: 'train', chapter: { n: 11, title: '它是怎么学会的？', sub: '训练：损失函数与梯度下降' },
    lines: [
      '那么，这些矩阵里的几千亿个数字，是怎么确定的呢？答案是：训练。',
      '我们把海量的文本喂给模型，让它不停地玩"猜下一个词"的游戏。一开始，参数都是随机的，它完全是在乱猜。',
      '每猜一次，就用损失函数衡量它错得有多离谱：给正确答案的概率越低，损失就越大。常用的损失，是正确答案概率的负对数。',
      '然后，用微积分里的求导，算出每个参数该往哪个方向调，才能让损失变小一点点。这叫做梯度下降，就像蒙着眼睛下山：每一步，都朝最陡的方向迈一小步。',
      '在数千亿、甚至上万亿个词上反复练习之后，模型就从胡言乱语，变成了能写诗、能编程、能聊天的 AI。',
    ],
    draw(D, t, S) {
      // parameter counter
      const cA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.6);
      if (cA > 0) {
        const n = Math.floor(175e9 * ease.out(S.raw(0, 0.5, 2.5)));
        D.text(n.toLocaleString('en-US'), 960, 430, { size: 130, fam: MONO, weight: 900, color: C.q, alpha: cA, glow: 24 });
        D.text('GPT-3 的参数个数（1750 亿）', 960, 560, { size: 44, weight: 700, alpha: cA });
        D.text('全部都是矩阵里的数字', 960, 630, { size: 34, color: C.dim, alpha: cA * S.p(0, 2.0, 0.6) });
      }
      // data stream + random guesses
      const dA = S.p(1, 0.2, 0.6) * S.gone(2, 0, 0.6);
      if (dA > 0) {
        const snippets = ['床前明月光，疑是地上霜', '光合作用需要阳光和水', 'print("hello world")', '今天天气真好', '三角形内角和是180度', 'To be or not to be', '水的沸点是100摄氏度', '巴黎是法国的首都'];
        snippets.forEach((s, i) => {
          const phase = ((t - S.cue(1)) * 0.25 + i / snippets.length) % 1;
          const x = lerp(-200, 740, phase), y = 250 + (i % 8) * 75;
          D.text(s, x, y, { size: 26, color: C.dim, alpha: dA * clamp(Math.sin(phase * Math.PI) * 2), align: 'center' });
        });
        D.box(760, 380, 300, 220, { r: 24, fill: hexA(C.purple, 0.2), stroke: C.purple, lw: 3, alpha: dA });
        D.text('模型', 910, 470, { size: 50, weight: 900, color: C.purple, alpha: dA });
        D.text('（参数随机）', 910, 530, { size: 26, color: C.dim, alpha: dA });
        const words = ['散步', '玩', '野餐', '跑步', '看花', '吃饭', '猫', '的'];
        const frame = Math.floor(t * 4);
        const R = rng(frame);
        const raw = words.map(() => R()); const s = raw.reduce((a, b) => a + b, 0);
        words.forEach((w, i) => {
          const y = 260 + i * 66, p = raw[i] / s;
          D.text(w, 1250, y, { size: 30, align: 'right', alpha: dA });
          D.box(1270, y - 18, 1400 * p, 36, { r: 6, fill: hexA(C.k, 0.7), alpha: dA });
        });
        D.text('一开始：瞎猜', 1450, 820, { size: 40, weight: 900, color: C.red, alpha: dA * S.p(1, 2.5, 0.5) });
      }
      // loss
      const lA = S.p(2, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (lA > 0) {
        const ox = 300, oy = 800, sx = 800, sy = 110;
        D.line(ox, oy, ox + sx + 40, oy, { color: C.dim, lw: 2, alpha: lA });
        D.line(ox, oy, ox, oy - 540, { color: C.dim, lw: 2, alpha: lA });
        D.text('正确答案的概率 p', ox + sx / 2, oy + 50, { size: 28, color: C.dim, alpha: lA });
        D.text('损失', ox - 20, oy - 520, { size: 28, color: C.dim, alpha: lA, align: 'right' });
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= lA; ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.beginPath();
        for (let k = 0; k <= 100; k++) { const p = 0.008 + k / 100 * 0.992; const px = ox + p * sx, py = oy - Math.min(4.8, -Math.log(p)) * sy; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); ctx.restore();
        const pp = lerp(0.03, 0.9, (Math.sin((t - S.cue(2)) * 0.8 - 1.5) + 1) / 2);
        const L = -Math.log(pp);
        D.circle(ox + pp * sx, oy - L * sy, 14, { fill: C.yellow, alpha: lA, glow: 14 });
        D.text(`p = ${pp.toFixed(2)}   损失 = ${L.toFixed(2)}`, ox + pp * sx + 24, oy - L * sy - 30, { size: 30, fam: MONO, align: 'left', alpha: lA, color: C.yellow });
        Hh.formula(D, [{ s: 'Loss', fam: MAIN, color: C.red }, ' = −log ', { s: 'p', fam: MATH }, '(正确答案)'], 1450, 330, { size: 52, alpha: lA * S.p(2, 1.0, 0.6) });
        D.text('p → 1：损失 → 0（猜对了！）', 1450, 450, { size: 32, color: C.v, alpha: lA * S.p(2, 2.0, 0.6) });
        D.text('p → 0：损失 → ∞（错得离谱）', 1450, 510, { size: 32, color: C.red, alpha: lA * S.p(2, 2.6, 0.6) });
      }
      // gradient descent
      const gA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (gA > 0) {
        const f = x => 0.35 * Math.sin(1.3 * x) + 0.08 * (x - 1.2) * (x - 1.2) + 0.2 * Math.sin(3.1 * x + 1);
        const df = x => (f(x + 1e-3) - f(x - 1e-3)) / 2e-3;
        const X = x => 180 + (x + 3) * 170, Y = y => 700 - y * 260;
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= gA;
        const g = ctx.createLinearGradient(0, 300, 0, 900); g.addColorStop(0, hexA(C.v, 0.35)); g.addColorStop(1, hexA(C.v, 0.02));
        ctx.beginPath(); ctx.moveTo(X(-3), 900);
        for (let x = -3; x <= 5; x += 0.05) ctx.lineTo(X(x), Y(f(x)));
        ctx.lineTo(X(5), 900); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = C.v; ctx.lineWidth = 4; ctx.beginPath();
        for (let x = -3; x <= 5; x += 0.05) x === -3 ? ctx.moveTo(X(x), Y(f(x))) : ctx.lineTo(X(x), Y(f(x)));
        ctx.stroke(); ctx.restore();
        // steps
        let x = -2.6; const lr = 0.55, steps = [];
        for (let i = 0; i < 14; i++) { steps.push(x); x -= lr * df(x); }
        const k = clamp((t - S.cue(3) - 1.5) / 0.65, 0, steps.length - 1);
        const i0 = Math.floor(k), fr = ease.inOut(k - i0);
        const bx = lerp(steps[i0], steps[Math.min(i0 + 1, steps.length - 1)], fr);
        for (let i = 0; i <= i0; i++) D.circle(X(steps[i]), Y(f(steps[i])), 6, { fill: C.yellow, alpha: gA * 0.5 });
        const slope = df(bx);
        const tx = 0.6;
        D.line(X(bx - tx), Y(f(bx) - slope * tx), X(bx + tx), Y(f(bx) + slope * tx), { color: C.pink, lw: 3, alpha: gA });
        D.circle(X(bx), Y(f(bx)) - 20, 20, { fill: C.q, alpha: gA, glow: 16 });
        D.text('坡度（导数）', X(bx) + 60, Y(f(bx)) - 70, { size: 26, color: C.pink, align: 'left', alpha: gA });
        D.text('参数', X(4.6), 860, { size: 28, color: C.dim, alpha: gA });
        D.text('损失', 150, 330, { size: 28, color: C.dim, alpha: gA });
        Hh.formula(D, [{ s: 'θ', fam: MATH, color: C.q }, ' ← ', { s: 'θ', fam: MATH, color: C.q }, ' − ', { s: 'η', fam: MATH }, ' ', { num: [{ s: '∂L', fam: MATH }], den: [{ s: '∂θ', fam: MATH }] }], 1450, 250, { size: 56, alpha: gA * S.p(3, 2.0, 0.6) });
        D.text('η：步长（学习率）', 1450, 350, { size: 28, color: C.dim, alpha: gA * S.p(3, 3.0, 0.6) });
        D.text('对 1750 亿个参数同时这样做', 1450, 400, { size: 28, color: C.dim, alpha: gA * S.p(3, 3.6, 0.6) });
      }
      // training curve & samples
      const tA = S.p(4, 0.2, 0.6);
      if (tA > 0) {
        const ox = 200, oy = 820, w = 700, h = 520;
        D.line(ox, oy, ox + w, oy, { color: C.dim, lw: 2, alpha: tA }); D.line(ox, oy, ox, oy - h, { color: C.dim, lw: 2, alpha: tA });
        D.text('训练步数 →', ox + w / 2, oy + 40, { size: 26, color: C.dim, alpha: tA });
        D.text('损失', ox - 16, oy - h + 10, { size: 26, color: C.dim, alpha: tA, align: 'right' });
        const pr = S.raw(4, 0.5, Math.max(3, S.d(4) - 1));
        const R = rng(5);
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= tA; ctx.strokeStyle = C.q; ctx.lineWidth = 3; ctx.beginPath();
        for (let k = 0; k <= 200 * pr; k++) { const u = k / 200; const y = 0.12 + 0.85 * Math.exp(-u * 5) + (R() - 0.5) * 0.05 * (1 - u * 0.7); k ? ctx.lineTo(ox + u * w, oy - y * h) : ctx.moveTo(ox + u * w, oy - y * h); }
        ctx.stroke(); ctx.restore();
        const samples = [['第 0 步', '园 了 啊 猫 的 的 是 呢', C.red], ['第 1 千步', '今天天气真真好好好了', C.yellow], ['第 10 万步', '今天天气真好，我们去公园散步吧。', C.v], ['训练完成', '写诗 · 编程 · 聊天 · 翻译 · 解题……', C.q]];
        samples.forEach(([step, s, c2], i) => {
          const a = clamp((pr - i * 0.24) / 0.08) * tA;
          D.text(step, 1000, 300 + i * 140, { size: 28, color: c2, weight: 700, align: 'left', alpha: a });
          D.text(s, 1000, 350 + i * 140, { size: 36, align: 'left', alpha: a, weight: i === 3 ? 900 : 400, color: i === 3 ? C.q : C.text });
        });
      }
    },
  });

  // ------------------------------------------------------------------ outro
  const PIPE = [['文字', C.text], ['词元', C.blue], ['向量 + 位置', C.k], ['Transformer 模块 ×N', C.q], ['概率', C.pink], ['下一个词', C.v]];
  add({
    id: 'outro', chapter: { n: 12, title: '总结', sub: '一张图看懂 Transformer' },
    lines: [
      '我们来回顾一下：文字先被切成词元，变成向量，再加上位置编码。',
      '然后，经过一层又一层的 Transformer 模块：注意力让词与词交流，前馈网络让每个词独立思考。',
      '最后，输出下一个词的概率，选出一个词，接上去，再来一遍。',
      '这就是 Transformer。从翻译、聊天，到画画、写代码，甚至预测蛋白质的结构，今天几乎所有最强大的 AI，都建立在它的基础之上。',
      '而这一切的核心，只是一个朴素的想法：让每个词，去关注它该关注的词。',
      { t: 'Attention is all you need. 谢谢观看！', s: 'Attention, is all you need. 谢谢大家的观看！', pause: 2.5 },
    ],
    tail: 3.0,
    draw(D, t, S) {
      const pA = S.p(0, -0.3, 0.6) * S.gone(3, 0, 0.6);
      if (pA > 0) {
        const xs = [170, 420, 700, 1060, 1420, 1700], y = 520;
        const hl = i => {
          const g = i <= 2 ? 0 : i === 3 ? 1 : 2;
          return clamp(S.p(g, 0, 0.5) - (g < 2 ? S.p(g + 1, 0, 0.5) * 0.6 : 0));
        };
        PIPE.forEach(([s, c2], i) => {
          const a = S.p(0, i * 0.35, 0.5) * pA;
          const h = hl(i);
          const w = i === 3 ? 360 : 200;
          D.box(xs[i] - w / 2, y - 60, w, 120, { r: 20, fill: hexA(c2, 0.12 + 0.18 * h), stroke: c2, lw: 2 + 2 * h, alpha: a, glow: 18 * h });
          D.text(s, xs[i], y + 1, { size: i === 3 ? 30 : 34, weight: 900, color: c2, alpha: a });
          if (i < PIPE.length - 1) D.arrow(xs[i] + w / 2 + 8, y, xs[i + 1] - (i + 1 === 3 ? 180 : 100) - 10, y, { color: C.dim, lw: 3, head: 12, alpha: a });
        });
        // inside block
        const bA = S.p(1, 0.8, 0.6) * pA;
        D.text('注意力：交流', 1060, 660, { size: 30, color: C.pink, weight: 700, alpha: bA });
        D.text('前馈：思考', 1060, 710, { size: 30, color: C.purple, weight: 700, alpha: S.p(1, 2.4, 0.6) * pA });
        // loop
        const lA = S.p(2, 1.0, 0.8) * pA;
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= lA; ctx.strokeStyle = C.v; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.moveTo(1700, 460); ctx.bezierCurveTo(1700, 250, 170, 250, 170, 460); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha *= lA; D.arrowHead(170, 458, Math.PI / 2, 18, C.v); ctx.restore();
        D.text('接到句子后面，再来一遍', 935, 250, { size: 32, color: C.v, alpha: lA, weight: 700 });
      }
      // applications ring
      const aA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (aA > 0) {
        const apps = [['翻译', C.k], ['聊天', C.q], ['画画', C.pink], ['写代码', C.v], ['蛋白质结构', C.purple], ['语音识别', C.yellow], ['视频生成', C.red], ['自动驾驶', C.blue]];
        const cx = 960, cy = 500;
        D.circle(cx, cy, 130, { fill: hexA(C.q, 0.15), stroke: C.q, lw: 4, alpha: aA, glow: 30 });
        D.text('Transformer', cx, cy + 2, { size: 38, weight: 900, color: C.q, alpha: aA });
        apps.forEach(([s, c2], i) => {
          const a = S.p(3, 0.5 + i * 0.35, 0.5) * aA;
          const ang = i / apps.length * Math.PI * 2 + t * 0.12;
          const x = cx + Math.cos(ang) * 400, y = cy + Math.sin(ang) * 270;
          D.line(cx + Math.cos(ang) * 135, cy + Math.sin(ang) * 135, x, y, { color: c2, lw: 2, alpha: a * 0.5 });
          D.chip(s, x, y, { size: 36, color: c2, alpha: a });
        });
      }
      // chord diagram
      const qA = S.p(4, 0.2, 0.8) * S.gone(5, -0.7, 0.6);
      if (qA > 0) {
        const chars = [...'让每个词去关注它该关注的词'];
        const cx = 960, cy = 470, r = 300, rot = (t - S.cue(4)) * 0.05;
        const N = chars.length;
        const pos = chars.map((_, i) => { const a = i / N * Math.PI * 2 - Math.PI / 2 + rot; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, a]; });
        const R = rng(12);
        const grow = S.raw(4, 0.3, 3.0);
        let k = 0;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const w = Math.pow(R(), 3);
          k++;
          if (w < 0.15 || k / (N * N) > grow) continue;
          const c2 = [C.q, C.k, C.pink, C.v, C.purple][i % 5];
          const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= qA * w * 0.9; ctx.strokeStyle = c2; ctx.lineWidth = 1 + 5 * w;
          ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.quadraticCurveTo(cx, cy, pos[j][0], pos[j][1]); ctx.stroke(); ctx.restore();
        }
        chars.forEach((ch, i) => {
          D.circle(pos[i][0], pos[i][1], 30, { fill: '#141b3d', stroke: C.q, lw: 2, alpha: qA });
          D.text(ch, pos[i][0], pos[i][1] + 2, { size: 30, weight: 700, alpha: qA });
        });
      }
      // finale
      const fA = S.p(5, -0.1, 1.0);
      if (fA > 0) {
        const title = 'Attention Is All You Need';
        D.text(title, 960, 420, { size: 96, fam: MAIN, weight: 700, color: C.q, alpha: fA, glow: 30 });
        D.text('谢谢观看！', 960, 560, { size: 64, weight: 900, alpha: S.p(5, 1.2, 0.8) });
        D.text('本视频由 JavaScript + Canvas 逐帧绘制 · 配音由本地神经网络 TTS 生成', 960, 700, { size: 28, color: C.dim, alpha: S.p(5, 2.2, 0.8) });
        const rp = S.raw(5, 0.2, 2.5);
        for (let k = 0; k < 3; k++) { const p = clamp(rp - k * 0.2); if (p > 0 && p < 1) D.circle(960, 480, 100 + p * 900, { stroke: [C.q, C.k, C.pink][k], lw: 3, alpha: (1 - p) * 0.6 }); }
      }
    },
  });
})();
