// Scenes: Q/K/V, attention step by step, the formula, attention map & mask, multi-head.
(function () {
  const E = window.ENGINE, Hh = window.H;
  const { C, clamp, lerp, ease, prog, hexA, MONO, MATH, MAIN, rng, softmax } = E;
  const add = s => window.SCENES.push(s);

  const S8 = ['小猫', '没有', '跳上', '桌子', '因为', '它', '太累', '了'];
  const IT = 5;
  const RAW = [6.2, 0.4, 1.4, 3.6, 0.6, 2.2, 2.8, 0.3];      // q(它)·k_j
  const SCALED = RAW.map(x => x / 2);                          // d = 4 → √d = 2
  const EXP = SCALED.map(Math.exp);
  const WTS = softmax(SCALED);
  const vecs = (seed, n, len) => Array.from({ length: n }, (_, i) => { const R = rng(seed + i * 13); return Array.from({ length: len }, () => +(R() * 2 - 1).toFixed(2)); });
  const KV = vecs(40, 8, 4), VV = vecs(90, 8, 6);
  // make 小猫's value distinctive (warm)
  VV[0] = [0.9, 0.8, -0.6, 0.7, 0.9, -0.4];
  const OUT = VV[0].map((_, k) => VV.reduce((a, v, j) => a + WTS[j] * v[k], 0));

  // attention map (rows = query token) used by heatmap + mask
  const SC = S8.map(() => S8.map(() => 0));
  S8.forEach((_, i) => SC[i][i] = 1.0);
  Object.assign(SC[0], { 0: 2.5, 2: 1.2 });
  Object.assign(SC[1], { 1: 1.0, 2: 2.2, 0: 1.0 });
  Object.assign(SC[2], { 3: 2.4, 0: 1.8, 1: 1.0 });
  Object.assign(SC[3], { 2: 2.2, 3: 1.5 });
  Object.assign(SC[4], { 6: 2.0, 1: 1.2 });
  SC[5] = SCALED.slice();
  Object.assign(SC[6], { 5: 2.6, 0: 1.6, 6: 1.0 });
  Object.assign(SC[7], { 6: 2.3, 4: 0.8, 7: 1.0 });
  const ATT = SC.map(r => softmax(r));
  const ATT_M = SC.map((r, i) => { const s = softmax(r.slice(0, i + 1)); return r.map((_, j) => j <= i ? s[j] : null); });

  // ------------------------------------------------------------------ ch5 QKV
  add({
    id: 'qkv', chapter: { n: 5, title: '注意力：Q、K、V', sub: '查询、键、值' },
    lines: [
      '来看这句话："小猫没有跳上桌子，因为它太累了。"这里的"它"，指的是谁？',
      '你一眼就知道是小猫：因为"太累"更适合描述小猫，而不是桌子。注意力机制，就是要让模型也学会这种判断。',
      '为此，每个词都会从自己的向量出发，生成三个新向量：查询 Query、键 Key，和值 Value。',
      '打个比方，就像在图书馆找书：Query 是你心里的问题，Key 是每本书书脊上的标签，Value 是书里真正的内容。',
      '这三个向量怎么来？就是用词向量分别乘以三个矩阵：W Q、W K 和 W V。矩阵里的每个数字，都是模型在训练中自己学出来的。',
    ],
    draw(D, t, S) {
      // sentence
      const sA = S.p(0, 0, 0.6) * S.gone(2, 0, 0.6);
      if (sA > 0) {
        const L = Hh.rowX(D, S8, 960, { size: 48, gap: 26 });
        const y = 480;
        const hl = S.p(1, 0.2, 0.6);
        D.curve(L.xs[IT], y - 45, L.xs[0], y - 45, 190, { color: C.q, lw: 7, p: S.p(1, 0.8, 0.9), alpha: sA, head: 22 });
        D.curve(L.xs[IT], y - 45, L.xs[3], y - 45, 90, { color: C.dim, lw: 3, p: S.p(1, 1.6, 0.8), alpha: sA * 0.7, head: 14 });
        S8.forEach((w, i) => D.chip(w, L.xs[i], y, { size: 48, color: i === IT ? C.q : i === 6 && hl > 0 ? C.k : C.blue, alpha: sA * S.p(0, 0.1 + i * 0.08, 0.4), glow: i === IT ? 14 : 0 }));
        const qa = S.p(0, 2.2, 0.5) * (1 - hl);
        D.text('?', L.xs[IT], y - 120 - 8 * Math.sin(t * 4), { size: 110, weight: 900, color: C.q, alpha: sA * qa, glow: 20 });
        D.text('小猫 ✓', L.xs[0], y + 110, { size: 40, color: C.v, weight: 900, alpha: sA * S.p(1, 2.4, 0.5) });
        D.text('桌子 ✗', L.xs[3], y + 110, { size: 40, color: C.red, weight: 900, alpha: sA * S.p(1, 3.0, 0.5) });
        D.text('会"累"的是谁？', L.xs[6], y + 110, { size: 36, color: C.k, weight: 700, alpha: sA * S.p(1, 1.2, 0.5) });
      }
      // x → q k v
      const bA = S.p(2, 0.3, 0.6) * S.gone(3, 0, 0.6);
      if (bA > 0) {
        D.chip('它', 260, 540, { size: 64, color: C.q, alpha: bA, glow: 12 });
        const x = [0.6, -0.3, 0.8, 0.1, -0.7, 0.4, 0.2, -0.5];
        D.vec(x, 380, 540 - 4 * 40 + 2, { dir: 'col', cell: 36, alpha: bA, gap: 4 });
        D.text('词向量 x', 398, 360, { size: 30, color: C.dim, alpha: bA });
        const rows = [['Q', 'Query 查询', '我在找什么？', C.q, 340], ['K', 'Key 键', '我有什么特征？', C.k, 540], ['V', 'Value 值', '我能提供什么信息？', C.v, 740]];
        rows.forEach(([s, name, desc, col, y], i) => {
          const p = S.p(2, 1.0 + i * 0.7, 0.7);
          D.curve(440, 540, 760, y, i === 1 ? 0 : (i === 0 ? -40 : 40), { color: col, lw: 4, p, alpha: bA });
          const R = rng(300 + i); const v = Array.from({ length: 6 }, () => R() * 2 - 1);
          D.vec(v, 790, y - 20, { cell: 40, alpha: bA * p, cmap: z => E.mix('#1c2450', col, (z + 1) / 2) });
          D.text(s, 1100, y, { size: 64, fam: MATH, color: col, alpha: bA * p, weight: 700 });
          D.text(name, 1170, y - 22, { size: 38, color: col, weight: 900, align: 'left', alpha: bA * p });
          D.text(desc, 1170, y + 26, { size: 32, color: C.text, align: 'left', alpha: bA * p });
        });
      }
      // library analogy
      const lA = S.p(3, 0.3, 0.6) * S.gone(4, 0, 0.6);
      if (lA > 0) {
        // query card
        Hh.panel(D, 110, 250, 460, 420, { title: 'Query：你的问题', color: C.q, alpha: lA });
        D.text('"我想找：', 340, 400, { size: 40, alpha: lA, weight: 700 });
        D.text('会累的东西"', 340, 460, { size: 40, alpha: lA, weight: 700, color: C.q });
        Hh.person(D, 340, 580, 90, C.q, lA);
        // shelf of keys
        Hh.panel(D, 640, 250, 560, 420, { title: 'Key：书脊上的标签', color: C.k, alpha: lA });
        const tags = ['动物', '否定', '动作', '家具', '原因', '代词', '状态', '语气'];
        const match = S.p(3, 3.5, 0.6);
        tags.forEach((tg, i) => {
          const x = 690 + i * 64 + 10, y = 460;
          const on = i === 0 ? match : 0;
          D.box(x - 26, y - 130 - on * 30, 52, 260, { r: 6, fill: hexA(on ? C.q : C.k, 0.2 + 0.4 * on), stroke: on ? C.q : C.k, lw: 2.5, alpha: lA, glow: on * 16 });
          const ctx = D.ctx; ctx.save(); ctx.translate(x, y - on * 30); ctx.rotate(-Math.PI / 2);
          D.text(tg, 0, 2, { size: 28, alpha: lA, weight: 700 }); ctx.restore();
          D.text(S8[i], x, y + 160, { size: 20, color: C.dim, alpha: lA });
        });
        D.curve(460, 420, 700, 320, -60, { color: C.q, lw: 4, p: match, alpha: lA });
        // value
        Hh.panel(D, 1270, 250, 540, 420, { title: 'Value：书里的内容', color: C.v, alpha: lA });
        const vp = S.p(3, 5.0, 0.6);
        D.box(1320, 330, 440, 290, { r: 10, fill: '#f6f1e6', alpha: lA * vp });
        D.line(1540, 340, 1540, 610, { color: '#c9c3b5', lw: 3, alpha: lA * vp });
        ['小猫：', '一种小动物', '会跳、会累、', '喜欢睡觉……'].forEach((s, i) => D.text(s, 1340, 380 + i * 50, { size: 28, color: '#2a2a35', align: 'left', alpha: lA * vp, weight: i ? 400 : 700 }));
        for (let i = 0; i < 5; i++) D.line(1565, 370 + i * 45, 1735, 370 + i * 45, { color: '#c9c3b5', lw: 7, alpha: lA * vp });
        D.text('用 Query 去匹配 Key，匹配上了，就取走它的 Value', 960, 760, { size: 38, weight: 700, alpha: lA * S.p(3, 6.0, 0.6) });
      }
      // matrix multiply x · W = q
      const mA = S.p(4, 0.2, 0.6);
      if (mA > 0) {
        const x = [0.6, -0.3, 0.8, 0.1];
        const R = rng(77); const Wm = x.map(() => [0, 0, 0].map(() => +(R() * 2 - 1).toFixed(1)));
        const q = [0, 1, 2].map(j => x.reduce((a, xi, i) => a + xi * Wm[i][j], 0));
        const cell = 80, y0 = 360;
        const col = Math.floor(clamp((t - S.cue(4) - 2.0) / 1.3, 0, 2.999));
        const act = t > S.cue(4) + 2.0;
        // x row
        D.text('x', 250, y0 - 60, { size: 56, fam: MATH, alpha: mA });
        x.forEach((v, i) => {
          const hy = y0 + 120;
          D.box(120 + i * 70, hy - 30, 64, 60, { r: 8, fill: E.signed(v), alpha: mA });
          D.text(v.toFixed(1), 152 + i * 70, hy + 1, { size: 24, fam: MONO, alpha: mA });
        });
        D.text('×', 450, y0 + 120, { size: 64, fam: MAIN, alpha: mA });
        // W matrix
        D.text('W', 620, y0 - 60, { size: 56, fam: MATH, color: C.q, alpha: mA });
        D.text('Q', 662, y0 - 42, { size: 32, fam: MATH, color: C.q, alpha: mA });
        Wm.forEach((row, i) => row.forEach((v, j) => {
          const hl = act && j === col;
          D.box(520 + j * cell, y0 + i * 60 - 0, cell - 6, 54, { r: 8, fill: hl ? hexA(C.q, 0.55) : E.signed(v * 0.8), stroke: hl ? C.q : null, lw: 3, alpha: mA });
          D.text(v.toFixed(1), 520 + j * cell + (cell - 6) / 2, y0 + i * 60 + 28, { size: 24, fam: MONO, alpha: mA });
        }));
        D.brackets(508, y0 - 10, cell * 3 + 12, 250, { alpha: mA });
        D.text('=', 830, y0 + 120, { size: 64, fam: MAIN, alpha: mA });
        D.text('q', 1010, y0 - 60, { size: 56, fam: MATH, color: C.q, alpha: mA });
        q.forEach((v, j) => {
          const shown = act && j <= col;
          D.box(900 + j * 76, y0 + 90, 70, 60, { r: 8, fill: shown ? E.mix('#1c2450', C.q, clamp(Math.abs(v))) : '#141b3d', stroke: j === col && act ? C.q : C.faint, lw: 2, alpha: mA });
          if (shown) D.text(v.toFixed(2), 935 + j * 76, y0 + 121, { size: 22, fam: MONO, alpha: mA });
        });
        D.text('每个输出数字 = x 与矩阵一列的点积', 700, y0 + 330, { size: 34, color: C.dim, alpha: mA * S.p(4, 2.4, 0.6) });
        // three matrices tags
        const tA = S.p(4, 4.5, 0.6);
        [['W', 'Q', C.q], ['W', 'K', C.k], ['W', 'V', C.v]].forEach(([a, b, col2], i) => {
          const x0 = 1420, y = 330 + i * 130;
          D.box(x0 - 80, y - 50, 300, 100, { r: 18, fill: hexA(col2, 0.15), stroke: col2, lw: 3, alpha: tA });
          Hh.formula(D, { base: [{ s: a, fam: MATH, color: col2 }], sub: [{ s: b, fam: MATH, color: col2 }] }, x0 - 20, y + 18, { size: 60, alpha: tA });
          D.text(['→ 生成 Q', '→ 生成 K', '→ 生成 V'][i], x0 + 110, y, { size: 32, color: col2, alpha: tA, weight: 700 });
        });
        D.text('训练中学出来的参数', 1490, 740, { size: 34, color: C.yellow, weight: 700, alpha: S.p(4, 5.5, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch6a attention steps
  add({
    id: 'attn1', chapter: { n: 6, title: '一步一步算注意力', sub: '打分 → 缩放 → softmax → 加权平均' },
    lines: [
      '好，现在让"它"来提问。第一步：用"它"的 Query，和每个词的 Key 分别做点积，得到一组分数。',
      '分数越高，说明这个词越符合"它"要找的东西。你看，"小猫"的分数最高。',
      '第二步：把分数除以根号 d，d 是向量的维度。因为维度越高，点积的数值往往越大，太大的数会让下一步变得过于极端。',
      '第三步，softmax。它先对每个分数求 e 的指数，把所有数都变成正数；再除以它们的总和，让所有结果加起来正好等于 1。',
      '这样，分数就变成了注意力权重。你看，"它"把一半以上的注意力，都分给了"小猫"。',
      '指数函数还会放大差距：分数高一点点，权重就高出一大截。所以 softmax 就像一个温柔版的"取最大值"。',
    ],
    draw(D, t, S) {
      const dim = 1 - 0.8 * S.p(5, 0, 0.6);
      const A = S.p(0, -0.4, 0.6) * dim;
      const rowY = i => 272 + i * 78;
      const XS = { tok: 150, key: 250, score: 640, scaled: 850, exp: 1060, bar: 1210 };
      // Query of 它
      const qv = [0.9, 0.4, -0.2, 0.7];
      D.text('"它"的 Query', 400, 150, { size: 30, color: C.q, weight: 700, alpha: A });
      D.vec(qv, 340, 176, { cell: 30, alpha: A, cmap: z => E.mix('#1c2450', C.q, (z + 1) / 2) });
      D.text('Key', XS.key + 64, 215, { size: 30, color: C.k, weight: 700, alpha: A });
      S8.forEach((w, i) => {
        const y = rowY(i);
        const ra = S.p(0, 0.1 + i * 0.05, 0.4) * A;
        const isMax = i === 0 ? S.p(1, 0.5, 0.5) : 0;
        if (isMax) D.box(XS.tok - 70, y - 34, 1720, 68, { r: 14, fill: hexA(C.q, 0.12 * isMax), stroke: hexA(C.q, 0.5 * isMax), lw: 2, alpha: A });
        D.chip(w, XS.tok, y, { size: 30, pad: 16, color: i === IT ? C.q : C.blue, alpha: ra });
        D.vec(KV[i], XS.key, y - 15, { cell: 30, alpha: ra, cmap: z => E.mix('#1c2450', C.k, (z + 1) / 2) });
        // dot
        const dp = S.p(0, 2.0 + i * 0.35, 0.4);
        D.text('·', XS.key + 150, y, { size: 44, alpha: ra * dp, color: C.q });
        D.arrow(XS.key + 180, y, XS.score - 70, y, { color: C.faint, lw: 2, head: 10, p: dp, alpha: ra });
        D.text(RAW[i].toFixed(1), XS.score, y, { size: 34, fam: MONO, color: C.text, weight: isMax ? 900 : 400, alpha: ra * dp });
        // scaled
        const sp = S.p(2, 2.2 + i * 0.1, 0.5);
        D.text(SCALED[i].toFixed(2), XS.scaled, y, { size: 34, fam: MONO, alpha: ra * sp });
        // exp
        const ep = S.p(3, 2.5 + i * 0.1, 0.5);
        D.text(EXP[i].toFixed(1), XS.exp, y, { size: 34, fam: MONO, color: C.pink, alpha: ra * ep });
        // weights
        const wp = S.p(4, 0.2 + i * 0.08, 0.9);
        D.box(XS.bar, y - 20, 560 * WTS[i] * wp / 0.6, 40, { r: 8, fill: i === 0 ? C.q : hexA(C.k, 0.75), alpha: ra * clamp(wp * 3) });
        D.text(`${(WTS[i] * 100 * wp).toFixed(0)}%`, XS.bar + 560 * WTS[i] * wp / 0.6 + 14, y, { size: 30, fam: MONO, align: 'left', alpha: ra * wp });
      });
      Hh.step(D, 1, '打分', XS.score - 60, 215, { alpha: S.p(0, 1.5, 0.5) * A, size: 32 });
      Hh.step(D, 2, '÷√d', XS.scaled - 60, 215, { alpha: S.p(2, 0, 0.5) * A, size: 32 });
      Hh.step(D, 3, 'eˣ', XS.exp - 50, 215, { alpha: S.p(3, 1.8, 0.5) * A, size: 32, color: C.pink });
      Hh.step(D, 4, '权重（和 = 1）', XS.bar + 20, 215, { alpha: S.p(4, 0, 0.5) * A, size: 32, color: C.v });
      // scale note
      const nA = S.p(2, 0.8, 0.6) * A * (1 - S.p(3, 0, 0.5));
      if (nA > 0) {
        D.box(1150, 110, 690, 140, { r: 16, fill: 'rgba(10,14,34,0.9)', stroke: C.q, lw: 2, alpha: nA });
        Hh.formula(D, [{ s: 'd', fam: MATH }, ' = 4  ⇒  ', { sqrt: [{ s: 'd', fam: MATH }] }, ' = 2'], 1300, 190, { size: 46, alpha: nA, align: 'left' });
        D.text('(真实模型中 d 常为 64 或 128)', 1495, 225, { size: 22, color: C.dim, alpha: nA });
      }
      // softmax formula
      const fA = S.p(3, 0.3, 0.6) * A * (1 - S.p(4, 0.5, 0.5));
      if (fA > 0) {
        D.box(1150, 90, 690, 160, { r: 16, fill: 'rgba(10,14,34,0.92)', stroke: C.pink, lw: 2, alpha: fA });
        Hh.formula(D, ['softmax(', { base: [{ s: 'x', fam: MATH }], sub: [{ s: 'i', fam: MATH }] }, ') = ', { num: [{ sup: [{ base: [{ s: 'x', fam: MATH }], sub: [{ s: 'i', fam: MATH }] }], base: [{ s: 'e', fam: MATH, color: C.pink }] }], den: ['Σ', { sup: [{ base: [{ s: 'x', fam: MATH }], sub: [{ s: 'j', fam: MATH }] }], base: [{ s: 'e', fam: MATH, color: C.pink }] }] }], 1495, 185, { size: 44, alpha: fA });
      }
      // sum label
      const sumA = S.p(4, 1.4, 0.6) * A;
      D.text(`合计：${Math.round(WTS.reduce((a, b) => a + b, 0) * 100)}%`, 1600, rowY(7) + 70, { size: 32, fam: MONO, color: C.v, weight: 700, alpha: sumA });
      // amplification panel
      const pA = S.p(5, 0.3, 0.6);
      if (pA > 0) {
        D.box(260, 180, 1400, 660, { r: 28, fill: 'rgba(8,11,28,0.95)', stroke: C.pink, lw: 3, alpha: pA });
        // e^x curve
        const ox = 360, oy = 740, sx = 110, sy = 12;
        D.line(ox, oy, ox + 380, oy, { color: C.dim, lw: 2, alpha: pA });
        D.line(ox, oy, ox, oy - 450, { color: C.dim, lw: 2, alpha: pA });
        const cp = S.raw(5, 0.5, 1.5);
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= pA; ctx.strokeStyle = C.pink; ctx.lineWidth = 5; ctx.beginPath();
        for (let k = 0; k <= 100 * cp; k++) { const xx = k / 100 * 3.3; const px = ox + xx * sx, py = oy - Math.exp(xx) * sy; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); ctx.restore();
        Hh.formula(D, [{ sup: [{ s: 'x', fam: MATH }], base: [{ s: 'y = e', fam: MATH, color: C.pink }] }], ox + 150, 320, { size: 50, alpha: pA });
        [1.1, 1.8, 3.1].forEach((xx, k) => {
          const a = S.p(5, 1.5 + k * 0.5, 0.4) * pA;
          const px = ox + xx * sx, py = oy - Math.exp(xx) * sy;
          D.line(px, oy, px, py, { color: C.faint, lw: 2, alpha: a, dash: [6, 6] });
          D.circle(px, py, 9, { fill: C.yellow, alpha: a });
          D.text(`e^${xx} ≈ ${Math.exp(xx).toFixed(1)}`, px + 14, py - 22, { size: 26, fam: MONO, align: 'left', alpha: a });
        });
        // bars compare
        const bx = 920;
        D.text('原始分数', bx + 150, 280, { size: 34, weight: 700, alpha: pA });
        D.text('softmax 权重', bx + 520, 280, { size: 34, weight: 700, color: C.q, alpha: pA });
        [0, 3, 6, 5].forEach((j, k) => {
          const y = 360 + k * 110;
          const a = S.p(5, 1.0 + k * 0.2, 0.5) * pA;
          D.text(S8[j], bx, y, { size: 32, alpha: a, align: 'left' });
          const w1 = SCALED[j] / 3.1 * 180, w2 = WTS[j] / WTS[0] * 300;
          D.box(bx + 80, y - 18, w1, 36, { r: 6, fill: hexA(C.k, 0.7), alpha: a });
          D.text(SCALED[j].toFixed(1), bx + 90 + w1, y, { size: 24, fam: MONO, align: 'left', alpha: a });
          D.box(bx + 370, y - 18, w2, 36, { r: 6, fill: j === 0 ? C.q : hexA(C.q, 0.5), alpha: a });
          D.text(`${(WTS[j] * 100).toFixed(0)}%`, bx + 380 + w2, y, { size: 24, fam: MONO, align: 'left', alpha: a });
        });
        D.text('差一点 → 差很多：温柔版的"取最大值"', 960, 800, { size: 36, weight: 700, color: C.pink, alpha: S.p(5, 3.0, 0.6) * pA });
      }
    },
  });

  // ------------------------------------------------------------------ ch6b weighted sum, formula, matrices, map, mask
  add({
    id: 'attn2',
    lines: [
      '第四步：用这些权重，对所有词的 Value 做加权平均。"小猫"的权重最大，它的内容占比也最大。',
      '于是，"它"的新向量里融入了大量"小猫"的信息。从此，"它"不再是一个模糊的代词。',
      '把这四步写成一个公式，就是 Transformer 论文里最著名的一行。',
      'Q 乘以 K 的转置，是所有 Query 和所有 Key 两两做点积；除以根号 d k，是缩放；softmax 把分数变成权重；最后乘以 V，做加权平均。',
      '而且，所有的词是同时计算的！把它们排成矩阵，一次矩阵乘法就全部搞定。这正是 GPU 最擅长的事，也是 Transformer 能训练得又快又大的秘密。',
      '把每个词对每个词的注意力画出来，就是这样一张注意力图：颜色越亮，关注越多。',
      '对于 GPT 这样写文章的模型，还有一条规矩：每个词只能看它前面的词，不能偷看后面的答案。这叫做"因果掩码"。',
    ],
    draw(D, t, S) {
      const vmap = z => E.mix('#1c2450', C.v, (z + 1) / 2);
      // weighted sum
      const wA = S.p(0, -0.4, 0.6) * S.gone(2, 0, 0.6);
      if (wA > 0) {
        const rowY = i => 230 + i * 78;
        D.text('Value', 360, 170, { size: 30, color: C.v, weight: 700, alpha: wA });
        D.text('× 权重', 640, 170, { size: 30, color: C.q, weight: 700, alpha: wA });
        const conv = S.p(0, 3.0, 1.4, ease.inOut);
        S8.forEach((w, i) => {
          const y = rowY(i), ra = S.p(0, i * 0.06, 0.4) * wA;
          D.chip(w, 150, y, { size: 30, pad: 16, color: i === IT ? C.q : C.blue, alpha: ra });
          D.vec(VV[i], 250, y - 15, { cell: 30, alpha: ra, cmap: vmap, gap: 3 });
          const mp = S.p(0, 1.0 + i * 0.1, 0.5);
          D.text(`× ${WTS[i].toFixed(2)}`, 580, y, { size: 30, fam: MONO, color: C.q, align: 'left', alpha: ra * mp, weight: i === 0 ? 900 : 400 });
          // scaled copy moving to sum point
          const sx = lerp(760, 1180, conv), sy = lerp(y, 540, conv);
          D.vec(VV[i].map(v => v * WTS[i] * 1.6), sx, sy - 15, { cell: 30, alpha: ra * mp * (1 - conv * 0.8) * (0.25 + WTS[i] * 1.5), cmap: vmap, gap: 3 });
        });
        const sp = S.p(0, 4.2, 0.6);
        D.circle(1260, 540, 50, { fill: hexA(C.q, 0.2), stroke: C.q, lw: 3, alpha: wA * sp });
        D.text('Σ', 1260, 542, { size: 56, fam: MAIN, color: C.q, alpha: wA * sp });
        D.arrow(1315, 540, 1420, 540, { color: C.q, lw: 4, alpha: wA * sp });
        const op = S.p(0, 4.6, 0.7);
        D.vec(OUT.map(v => v * 1.2), 1440, 525, { cell: 42, alpha: wA * op, cmap: vmap, gap: 4 });
        D.text('"它"的新向量', 1580, 470, { size: 34, color: C.q, weight: 700, alpha: wA * op });
        // it now knows
        const kA = S.p(1, 0.3, 0.6);
        D.chip('它', 1520, 700, { size: 52, color: C.q, alpha: wA * kA, glow: 16 * kA });
        D.text('=', 1610, 700, { size: 52, alpha: wA * kA, fam: MAIN });
        D.chip('小猫', 1720, 700, { size: 52, color: C.v, alpha: wA * S.p(1, 1.0, 0.6), glow: 16 });
        D.text('代词有了明确的指代', 1620, 800, { size: 32, color: C.dim, alpha: wA * S.p(1, 1.8, 0.6) });
      }
      // formula
      const fA = S.p(2, 0.2, 0.7) * S.gone(4, 0, 0.6);
      if (fA > 0) {
        const size = 84, y = 470;
        const d3 = S.d(3), c3 = S.cue(3);
        const hi = (a, b) => clamp((t - (c3 + a * d3)) / 0.4) * (1 - clamp((t - (c3 + b * d3)) / 0.4));
        const hQK = hi(0.0, 0.3), hS = hi(0.28, 0.46), hSm = hi(0.46, 0.7), hV = hi(0.7, 1.2);
        const qk = [{ s: 'Q', fam: MATH, color: C.q }, { sup: [{ s: 'T', fam: MATH, color: C.k }], base: [{ s: 'K', fam: MATH, color: C.k }] }];
        const frac = { num: [{ group: qk, box: C.q, boxA: hQK }], den: [{ group: [{ sqrt: [{ base: [{ s: 'd', fam: MATH }], sub: [{ s: 'k', fam: MATH }] }] }], box: C.yellow, boxA: hS }] };
        const left = [{ s: 'Attention', fam: MAIN }, '(', { s: 'Q', fam: MATH, color: C.q }, ', ', { s: 'K', fam: MATH, color: C.k }, ', ', { s: 'V', fam: MATH, color: C.v }, ') = '];
        const sm = [{ s: 'softmax', fam: MAIN, color: C.pink }, '('];
        const node = [...left, { group: [...sm, frac, ')'], box: C.pink, boxA: hSm }, { group: [{ s: 'V', fam: MATH, color: C.v }], box: C.v, boxA: hV }];
        const r = Hh.formula(D, node, 960, y, { size, alpha: fA });
        D.text('Attention Is All You Need (2017) · 公式 (1)', 960, 250, { size: 30, color: C.dim, fam: MAIN, alpha: fA * S.p(2, 0.8, 0.6) });
        // label positions
        const wl = Hh.fw(D, left, size), wsm = Hh.fw(D, sm, size), wf = Hh.fw(D, frac, size), wv = Hh.fw(D, [{ s: 'V', fam: MATH }], size);
        const x0 = r.x0, fx0 = x0 + wl + wsm, fx1 = fx0 + wf;
        const vx0 = x0 + wl + wsm + wf + Hh.fw(D, [')'], size);
        const lab = (x1, x2, yy, s, col, a) => Hh.brace(D, x1, x2, yy, s, { color: col, alpha: fA * a, size: 32 });
        lab(fx0 + 10, fx1 - 10, 590, '① 两两点积  ② 缩放', C.q, clamp((t - c3) / 0.5));
        lab(x0 + wl, fx0 - 8, 700, '③ 变成权重', C.pink, clamp((t - c3 - 0.46 * d3) / 0.5));
        lab(vx0, vx0 + wv, 700, '④ 加权平均', C.v, clamp((t - c3 - 0.7 * d3) / 0.5));
      }
      // matrices in parallel
      const mA = S.p(4, 0.2, 0.6) * S.gone(5, 0, 0.6);
      if (mA > 0) {
        const cell = 44, qx = 260, qy = 360, kx = 470, ky = 140;
        D.text('Q', qx + 2 * cell, qy - 40, { size: 48, fam: MATH, color: C.q, alpha: mA });
        for (let i = 0; i < 8; i++) {
          D.text(S8[i], qx - 20, qy + i * cell + cell / 2, { size: 22, align: 'right', alpha: mA });
          for (let k = 0; k < 4; k++) D.box(qx + k * cell + 2, qy + i * cell + 2, cell - 4, cell - 4, { r: 5, fill: E.mix('#1c2450', C.q, (KV[(i + 3) % 8][k] + 1) / 2), alpha: mA });
        }
        Hh.formula(D, { sup: [{ s: 'T', fam: MATH, color: C.k }], base: [{ s: 'K', fam: MATH, color: C.k }] }, kx - 60, ky + 2 * cell + 16, { size: 48, alpha: mA });
        for (let k = 0; k < 4; k++) for (let j = 0; j < 8; j++) D.box(kx + j * cell + 2, ky + k * cell + 2, cell - 4, cell - 4, { r: 5, fill: E.mix('#1c2450', C.k, (KV[j][k] + 1) / 2), alpha: mA });
        const fill = S.raw(4, 1.5, 0.9);
        D.matrix(ATT.map(r => r.map(v => v * 1.6)), kx, qy, { cell, numbers: false, alpha: mA, rowP: (i, j) => (fill * 16 - (i + j)) });
        const flash = fill > 0 && fill < 1 ? 1 - Math.abs(fill - 0.5) * 2 : 0;
        D.box(kx - 6, qy - 6, 8 * cell + 12, 8 * cell + 12, { r: 10, stroke: C.yellow, lw: 4, alpha: mA * flash, glow: 20 });
        D.text('64 个分数，一次算完', kx + 4 * cell, qy + 8 * cell + 50, { size: 34, weight: 700, color: C.yellow, alpha: mA * S.p(4, 2.4, 0.5) });
        Hh.gpu(D, 1350, 420, 150, mA * S.p(4, 3.2, 0.6));
        D.text('GPU：成千上万个核心并行计算', 1350, 560, { size: 34, weight: 700, color: C.v, alpha: mA * S.p(4, 3.4, 0.6) });
        D.text('RNN：8 个词要排队算 8 步', 1350, 660, { size: 32, color: C.dim, alpha: mA * S.p(4, 4.2, 0.6) });
        D.text('Transformer：一步到位', 1350, 715, { size: 32, color: C.q, weight: 700, alpha: mA * S.p(4, 4.6, 0.6) });
      }
      // attention map & mask
      const hA = S.p(5, 0.2, 0.6);
      if (hA > 0) {
        const cell = 76, x0 = 520, y0 = 190;
        const mk = S.p(6, 2.0, 1.2, ease.inOut);
        const M = ATT.map((r, i) => r.map((v, j) => {
          if (j > i && mk > 0.5) return null;
          const m = ATT_M[i][j] === null ? 0 : ATT_M[i][j];
          return lerp(v, j > i ? 0 : m, mk);
        }));
        D.matrix(M.map(r => r.map(v => v === null ? null : v)), x0, y0, { cell, alpha: hA, numbers: true, digits: 2, textSize: 20, cmap: v => E.heat(Math.pow(v, 0.6)), rowP: (i, j) => S.raw(5, 0.3, 1.2) * 16 - (i + j) });
        S8.forEach((w, i) => {
          D.text(w, x0 - 16, y0 + i * cell + cell / 2, { size: 28, align: 'right', alpha: hA, color: i === IT ? C.q : C.text, weight: i === IT ? 900 : 400 });
          D.text(w, x0 + i * cell + cell / 2, y0 - 26, { size: 26, alpha: hA, color: C.k });
        });
        D.text('被关注的词（Key）→', x0 + 4 * cell, y0 - 70, { size: 26, color: C.dim, alpha: hA });
        const ctx = D.ctx; ctx.save(); ctx.translate(x0 - 120, y0 + 4 * cell); ctx.rotate(-Math.PI / 2);
        D.text('提问的词（Query）→', 0, 0, { size: 26, color: C.dim, alpha: hA }); ctx.restore();
        const rh = S.p(5, 2.0, 0.6);
        D.box(x0 - 4, y0 + IT * cell - 4, 8 * cell + 8, cell + 8, { r: 10, stroke: C.q, lw: 4, alpha: hA * rh * (1 - mk * 0.6) });
        D.text('每一行加起来 = 1', 1330, 330, { size: 34, alpha: hA * S.p(5, 2.5, 0.6), align: 'left', weight: 700 });
        D.text('"它"这一行：最亮的是"小猫"', 1330, 390, { size: 30, color: C.q, alpha: hA * rh, align: 'left' });
        // mask
        const mA2 = S.p(6, 0.5, 0.6);
        if (mA2 > 0) {
          ctx.save(); ctx.globalAlpha *= mA2 * (1 - mk);
          ctx.fillStyle = 'rgba(255,80,80,0.28)';
          ctx.beginPath(); ctx.moveTo(x0 + cell, y0); ctx.lineTo(x0 + 8 * cell, y0); ctx.lineTo(x0 + 8 * cell, y0 + 7 * cell);
          for (let k = 7; k >= 1; k--) { ctx.lineTo(x0 + k * cell, y0 + k * cell); ctx.lineTo(x0 + k * cell, y0 + (k - 1) * cell); }
          ctx.closePath(); ctx.fill(); ctx.restore();
          D.text('因果掩码 Causal Mask', 1330, 520, { size: 40, weight: 900, color: C.red, align: 'left', alpha: mA2 });
          D.text('右上角 = "未来"的词 → 挡住！', 1330, 580, { size: 30, align: 'left', alpha: mA2 });
          D.text('每一行只在"过去"里重新分配权重', 1330, 630, { size: 30, align: 'left', color: C.dim, alpha: S.p(6, 3.0, 0.6) });
          D.text('（被挡住的格子分数设为 −∞，e^−∞ = 0）', 1330, 680, { size: 26, align: 'left', color: C.dim, alpha: S.p(6, 3.6, 0.6) });
        }
      }
    },
  });

  // ------------------------------------------------------------------ ch7 multi-head
  const HEADS = [
    { name: '头 1 · 语法分析员', col: C.q, arcs: [[2, 0, 1], [2, 3, 0.9], [6, 5, 0.8]] },
    { name: '头 2 · 指代侦探', col: C.pink, arcs: [[5, 0, 1], [5, 3, 0.3]] },
    { name: '头 3 · 邻居观察者', col: C.k, arcs: [[1, 0, 0.8], [2, 1, 0.8], [3, 2, 0.8], [4, 3, 0.8], [5, 4, 0.8], [6, 5, 0.8], [7, 6, 0.8]] },
    { name: '头 4 · 因果推理者', col: C.v, arcs: [[4, 6, 1], [4, 1, 0.7], [6, 0, 0.5]] },
  ];
  add({
    id: 'heads', chapter: { n: 7, title: '多头注意力', sub: '一群注意力，分工合作' },
    lines: [
      '但是，句子里的关系是多种多样的：谁是主语、哪个词修饰哪个词、代词指代谁……只用一种注意力，很可能顾不过来。',
      '所以，Transformer 会同时运行很多组注意力，叫做"多头注意力"。每个头都有自己的一套 Q、K、V 矩阵，各自学习关注不同的关系。',
      '就像一个小组分工合作：有人专门分析语法，有人专门找指代，有人盯着前后相邻的词。',
      '最后，把所有头的输出拼接起来，再乘一个矩阵，融合成一个向量。原始论文用了 8 个头，GPT-3 用了 96 个头。',
    ],
    draw(D, t, S) {
      // many relations at once
      const rA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.6);
      if (rA > 0) {
        const L = Hh.rowX(D, S8, 960, { size: 46, gap: 28 }); const y = 540;
        const rel = [[5, 0, C.pink, '指代'], [6, 5, C.q, '主谓'], [2, 3, C.k, '动宾'], [1, 2, C.v, '修饰'], [4, 6, C.purple, '原因']];
        rel.forEach(([a, b, col, name], k) => {
          const p = S.p(0, 1.5 + k * 0.9, 0.8);
          const up = k % 2 === 0;
          const bend = (up ? 1 : -1) * Math.abs(a - b) * 45 * Math.sign(b - a || 1) * -1;
          const yy = up ? y - 42 : y + 42;
          D.curve(L.xs[a], yy, L.xs[b], yy, up ? -Math.abs(bend) * Math.sign(b - a) : Math.abs(bend) * Math.sign(b - a), { color: col, lw: 5, p, alpha: rA, head: 16 });
          const mx = (L.xs[a] + L.xs[b]) / 2;
          D.text(name, mx, up ? yy - Math.abs(a - b) * 25 - 40 : yy + Math.abs(a - b) * 25 + 40, { size: 30, color: col, weight: 700, alpha: rA * p });
        });
        S8.forEach((w, i) => D.chip(w, L.xs[i], y, { size: 46, alpha: rA }));
      }
      // head panels
      const pA = S.p(1, 0.5, 0.6) * S.gone(3, 0, 0.6);
      if (pA > 0) {
        HEADS.forEach((h, k) => {
          const px = k % 2 ? 990 : 110, py = k < 2 ? 150 : 500, pw = 820, ph = 320;
          const a = S.p(1, 0.8 + k * 0.4, 0.6) * pA;
          Hh.panel(D, px, py, pw, ph, { alpha: a, color: h.col });
          const nm = S.p(2, 0.3 + k * 0.9, 0.6);
          D.text(h.name, px + pw / 2, py + 44, { size: 34, weight: 900, color: h.col, alpha: a * nm });
          D.text(`头 ${k + 1}`, px + pw / 2, py + 44, { size: 34, weight: 900, color: h.col, alpha: a * (1 - nm) });
          const L = Hh.rowX(D, S8, px + pw / 2, { size: 28, gap: 12, pad: 14 }); const y = py + 250;
          h.arcs.forEach(([from, to, w]) => {
            const pulse = 0.75 + 0.25 * Math.sin(t * 3 + k + from);
            D.curve(L.xs[from], y - 26, L.xs[to], y - 26, Math.sign(to - from) * -Math.max(40, Math.abs(to - from) * 40), { color: h.col, lw: 2 + 5 * w, p: S.p(1, 1.4 + k * 0.4, 0.8), alpha: a * w * pulse, head: 12 });
          });
          S8.forEach((w, i) => D.chip(w, L.xs[i], y, { size: 28, pad: 14, alpha: a, color: C.blue }));
          D.text('W_Q W_K W_V', px + pw - 30, py + ph - 26, { size: 20, fam: MONO, color: C.dim, align: 'right', alpha: a * 0.8 });
        });
      }
      // concat
      const cA = S.p(3, 0.2, 0.6);
      if (cA > 0) {
        const cp = S.p(3, 1.0, 1.4, ease.inOut);
        const cell = 42;
        HEADS.forEach((h, k) => {
          const R = rng(500 + k); const v = Array.from({ length: 4 }, () => R() * 2 - 1);
          const sx = 260 + k * 400, sy = 330;
          const tx = 960 - 8 * (cell + 3) + k * 4 * (cell + 3), ty = 520;
          D.text(`头 ${k + 1}`, lerp(sx + 70, tx + 70, cp), lerp(sy - 40, ty - 40, cp), { size: 26, color: h.col, alpha: cA, weight: 700 });
          D.vec(v, lerp(sx, tx, cp), lerp(sy, ty, cp), { cell, alpha: cA, cmap: z => E.mix('#1c2450', h.col, (z + 1) / 2) });
        });
        D.text('拼接 Concat', 960, 620, { size: 32, color: C.dim, alpha: cA * S.p(3, 2.2, 0.5) });
        const wp = S.p(3, 2.8, 0.6);
        D.arrow(960, 650, 960, 720, { color: C.text, lw: 4, alpha: cA * wp });
        Hh.formula(D, [{ s: '× ', fam: MAIN }, { base: [{ s: 'W', fam: MATH, color: C.purple }], sub: [{ s: 'O', fam: MATH, color: C.purple }] }], 1080, 700, { size: 44, alpha: cA * wp });
        const R = rng(600); const o = Array.from({ length: 8 }, () => R() * 2 - 1);
        D.vec(o, 960 - 4 * 43, 750, { cell: 40, alpha: cA * S.p(3, 3.4, 0.6), cmap: z => E.mix('#1c2450', C.purple, (z + 1) / 2) });
        const nA = S.p(3, 4.4, 0.6);
        D.chip('原始论文：8 个头', 560, 810, { size: 34, color: C.q, alpha: cA * nA });
        D.chip('GPT-3：96 个头', 1360, 810, { size: 34, color: C.k, alpha: cA * S.p(3, 5.4, 0.6) });
      }
    },
  });
})();
