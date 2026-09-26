// Scenes: intro, next-word game, tokens & embeddings, dot product, context problem.
(function () {
  const E = window.ENGINE, Hh = window.H;
  const { C, W, clamp, lerp, ease, prog, hexA, MONO, MATH, MAIN, rng } = E;
  const add = s => window.SCENES.push(s);

  // ------------------------------------------------------------------ intro
  add({
    id: 'intro', lead: 0.8,
    lines: [
      '你有没有想过：当你向 ChatGPT 提一个问题，它到底是怎么"想"出答案的？',
      '它的核心，是一种叫做 Transformer 的神经网络结构。',
      '2017 年，谷歌的八位研究者发表了一篇论文，标题只有五个英文单词：Attention Is All You Need，意思是"注意力就是你所需要的一切"。',
      '今天，我们就从零开始，把 Transformer 彻底拆开来看。不需要高深的数学，学过高中数学就够了。',
    ],
    draw(D, t, S) {
      // --- chat window
      const chatA = S.p(0, -0.6, 0.6) * S.gone(1, -0.2);
      if (chatA > 0) {
        Hh.panel(D, 520, 230, 880, 520, { alpha: chatA, color: C.dim });
        D.circle(560, 262, 8, { fill: C.red, alpha: chatA }); D.circle(586, 262, 8, { fill: C.yellow, alpha: chatA }); D.circle(612, 262, 8, { fill: C.v, alpha: chatA });
        const q = 'Transformer 到底是什么？';
        const n = Math.floor(clamp((t - S.cue(0) - 0.2) / 1.4) * q.length);
        const qs = q.slice(0, n);
        const qw = D.measure(q, 40, 500) + 60;
        D.box(1360 - qw, 320, qw, 80, { r: 26, fill: hexA(C.blue, 0.35), stroke: C.blue, alpha: chatA });
        D.text(qs + (n < q.length && Math.floor(t * 3) % 2 ? '|' : ''), 1360 - qw + 30, 362, { size: 40, align: 'left', weight: 500, alpha: chatA });
        const thinkA = prog(t, S.cue(0) + 1.8, 0.4) * chatA;
        D.box(560, 450, 420, 90, { r: 26, fill: hexA(C.purple, 0.25), stroke: C.purple, alpha: thinkA });
        for (let i = 0; i < 3; i++) D.circle(620 + i * 40, 495, 10 + 4 * Math.sin(t * 6 - i), { fill: C.purple, alpha: thinkA });
        D.text('正在思考……', 850, 497, { size: 32, color: C.dim, alpha: thinkA });
        // mysterious box
        const bxA = prog(t, S.cue(0) + 2.6, 0.5) * chatA;
        D.box(700, 590, 520, 110, { r: 18, fill: 'rgba(0,0,0,0.5)', stroke: C.q, lw: 3, alpha: bxA, glow: 12 });
        D.text('？ 黑 盒 子 ？', 960, 646, { size: 48, weight: 900, color: C.q, alpha: bxA });
      }
      // --- title
      const title = 'Transformer';
      const titleUp = S.p(2, 0, 1.0, ease.inOut);
      const titleOut = S.gone(3, 0, 0.6);
      const ty = lerp(500, 190, titleUp), ts = lerp(170, 96, titleUp);
      if (t > S.cue(1) - 0.2 && titleOut > 0) {
        D.font(ts, 900);
        const tw = D.measure(title, ts, 900);
        let x = 960 - tw / 2;
        [...title].forEach((ch, i) => {
          const p = ease.back(prog(t, S.cue(1) + i * 0.05, 0.7));
          const cw = D.measure(ch, ts, 900);
          const col = E.mix(C.q, C.k, i / (title.length - 1));
          D.text(ch, x + cw / 2, ty - (1 - p) * 120, { size: ts, weight: 900, color: col, alpha: clamp(p * 1.5) * titleOut, glow: 20 });
          x += cw;
        });
        const subA = S.p(1, 0.9) * (1 - titleUp) * titleOut;
        D.text('什么是', 960, ty - 140, { size: 48, color: C.dim, alpha: subA, weight: 700 });
        D.text('ChatGPT 等大语言模型背后的核心结构', 960, ty + 130, { size: 42, color: C.text, alpha: subA, weight: 500 });
        // expanding ring burst
        const rp = prog(t, S.cue(1) + 0.5, 1.4);
        if (rp > 0 && rp < 1) D.circle(960, ty, 200 + rp * 700, { stroke: C.q, lw: 3, alpha: (1 - rp) * 0.5 });
      }
      // --- paper card
      const paperA = S.p(2, 0.6, 0.8) * S.gone(3, 0, 0.6);
      if (paperA > 0) {
        const ctx = D.ctx; ctx.save();
        const sc = lerp(0.8, 1, ease.back(S.raw(2, 0.6, 0.8)));
        ctx.translate(960, 600); ctx.rotate(-0.025); ctx.scale(sc, sc);
        D.box(-420, -230, 840, 460, { r: 6, fill: '#f6f1e6', alpha: paperA });
        D.text('Attention Is All You Need', 0, -150, { size: 50, fam: MAIN, weight: 700, color: '#1d1d28', alpha: paperA });
        D.text('Vaswani · Shazeer · Parmar · Uszkoreit · Jones · Gomez · Kaiser · Polosukhin', 0, -90, { size: 21, fam: MAIN, color: '#555', alpha: paperA });
        D.text('Google Brain · Google Research · 2017', 0, -58, { size: 21, fam: MAIN, color: '#777', alpha: paperA });
        const R = rng(3);
        for (let i = 0; i < 7; i++) { const w = 560 + R() * 180; D.line(-w / 2, -10 + i * 26, w / 2, -10 + i * 26, { color: '#c9c3b5', lw: 8, alpha: paperA }); }
        for (let i = 0; i < 8; i++) Hh.person(D, -315 + i * 90, 190, 46, [C.q, C.k, C.v, C.pink, C.purple, C.blue, C.yellow, C.red][i], paperA * S.p(2, 1.4 + i * 0.12, 0.4));
        ctx.restore();
      }
      // --- roadmap
      const stops = ['猜下一个词', '词向量', '点积', '注意力', '多头', '位置编码', '前馈与堆叠', '训练'];
      const rmA = S.p(3, 0.3, 0.6);
      if (rmA > 0) {
        D.text('本期路线图', 960, 250, { size: 44, weight: 900, color: C.q, alpha: rmA });
        const pts = stops.map((_, i) => [240 + i * 206, 560 + 70 * Math.sin(i * 1.1)]);
        const lp = S.raw(3, 0.5, 3.2);
        for (let i = 0; i < stops.length - 1; i++) {
          const seg = clamp(lp * (stops.length - 1) - i);
          if (seg > 0) D.line(pts[i][0], pts[i][1], lerp(pts[i][0], pts[i + 1][0], seg), lerp(pts[i][1], pts[i + 1][1], seg), { color: C.faint, lw: 5, alpha: rmA });
        }
        stops.forEach((s, i) => {
          const a = ease.back(prog(lp * (stops.length - 1), i - 0.3, 0.6));
          if (a <= 0) return;
          const col = [C.q, C.k, C.v, C.pink, C.purple, C.blue, C.yellow, C.red][i];
          D.circle(pts[i][0], pts[i][1], 38 * a, { fill: '#10183a', alpha: rmA });
          D.circle(pts[i][0], pts[i][1], 38 * a, { fill: hexA(col, 0.25), stroke: col, lw: 3, alpha: rmA });
          D.text(String(i + 1), pts[i][0], pts[i][1] + 2, { size: 34, weight: 900, fam: MONO, color: col, alpha: rmA * a });
          D.text(s, pts[i][0], pts[i][1] + 78, { size: 30, weight: 700, alpha: rmA * a });
        });
      }
    },
  });

  // ------------------------------------------------------------------ ch1 next word
  add({
    id: 'next', chapter: { n: 1, title: '一个猜词游戏', sub: '语言模型到底在做什么？' },
    lines: [
      '先说一个惊人的事实：ChatGPT 这样的模型，本质上只在做一件事——猜下一个词。',
      '比如这句话："今天天气真好，我们一起去公园"，后面最可能接什么？',
      '模型会给词表里的每一个词打一个概率："散步"可能占百分之四十，"玩"占百分之二十五，"野餐"占百分之十五……',
      '然后选出一个词，接到句子后面，再猜下一个。就这样一个接一个，写出了一整段话。',
      '所以，关键问题变成了：怎样才能猜得准？要猜得准，就必须真正"读懂"前面的内容。',
    ],
    draw(D, t, S) {
      // statement
      const stA = S.p(0, 0, 0.6) * S.gone(1, -0.3);
      D.text('模型只做一件事：', 960, 360, { size: 56, color: C.dim, weight: 700, alpha: stA });
      D.text('猜下一个词', 960, 500, { size: 130, color: C.q, weight: 900, alpha: stA * S.p(0, 1.2, 0.6), glow: 30 });

      const base = ['今天', '天气', '真', '好', '，', '我们', '一起', '去', '公园'];
      const gen = ['散步', '，', '顺便', '买', '冰淇淋', '！'];
      const genT = gen.map((_, i) => i === 0 ? S.cue(3) + 0.2 : S.cue(3) + 1.6 + (i - 1) * 0.75);
      let n = 0, f = 1;
      genT.forEach((gt, i) => { const p = ease.out(prog(t, gt, 0.6)); if (p > 0) { n = i + 1; f = p; } });
      const words = base.concat(gen.slice(0, n));
      const o = { size: 36, gap: 14, pad: 18 };
      const withBlank = words.concat(['？？']);
      const L1 = Hh.rowX(D, withBlank, 960, o);
      const L0 = Hh.rowX(D, base.concat(gen.slice(0, Math.max(0, n - 1))).concat(['？？']), 960, o);
      const sa = S.p(1, 0, 0.6) * S.gone(4, 0, 0.6);
      const sy = 300;
      if (sa > 0) {
        words.forEach((w, i) => {
          const x = i < L0.xs.length - 1 ? lerp(L0.xs[i], L1.xs[i], f) : L1.xs[i];
          const isGen = i >= base.length;
          const a = isGen && i === words.length - 1 ? f : 1;
          D.chip(w, x, sy - (isGen && i === words.length - 1 ? (1 - f) * 80 : 0), { size: 36, pad: 18, color: isGen ? C.q : C.blue, alpha: sa * a, scale: isGen && i === words.length - 1 ? lerp(1.4, 1, f) : 1 });
        });
        const bx = L1.xs[L1.xs.length - 1];
        const blink = 0.55 + 0.45 * Math.sin(t * 5);
        const doneGen = t > genT[genT.length - 1] + 0.5;
        if (!doneGen) D.box(bx - 50, sy - 31, 100, 62, { r: 20, stroke: C.q, lw: 3, alpha: sa * blink * S.p(1, 1.0, 0.4) });
        if (!doneGen) D.text('?', bx, sy + 2, { size: 40, weight: 900, color: C.q, alpha: sa * blink * S.p(1, 1.0, 0.4) });
      }
      // probability bars
      const opts = [['散步', 0.40], ['玩', 0.25], ['野餐', 0.15], ['跑步', 0.08], ['看花', 0.06], ['吃饭', 0.04], ['……', 0.02]];
      const barA = S.p(2, 0, 0.5) * S.gone(3, 1.0, 0.6);
      if (barA > 0) {
        D.text('下一个词的概率', 960, 410, { size: 32, color: C.dim, alpha: barA, weight: 700 });
        opts.forEach(([w, p], i) => {
          const y = 470 + i * 60, gp = S.p(2, 0.4 + i * 0.12, 0.9);
          D.text(w, 640, y, { size: 36, align: 'right', alpha: barA, weight: 500, color: i === 0 ? C.q : C.text });
          D.box(670, y - 20, 900 * p * 1.8 * gp, 40, { r: 8, fill: i === 0 ? C.q : hexA(C.k, 0.7), alpha: barA });
          D.text(`${Math.round(p * 100 * gp)}%`, 690 + 900 * p * 1.8 * gp, y, { size: 30, align: 'left', fam: MONO, alpha: barA * gp });
        });
      }
      // generation loop diagram
      const loopA = S.p(3, 1.2, 0.6) * S.gone(4, 0, 0.6);
      if (loopA > 0) {
        D.box(760, 520, 400, 130, { r: 24, fill: hexA(C.purple, 0.2), stroke: C.purple, lw: 3, alpha: loopA, glow: 10 });
        D.text('Transformer', 960, 585, { size: 50, weight: 900, color: C.purple, alpha: loopA });
        D.arrow(600, 400, 760, 560, { color: C.dim, lw: 4, alpha: loopA });
        D.text('读入整句', 590, 490, { size: 28, color: C.dim, alpha: loopA, align: 'right' });
        D.arrow(1160, 585, 1330, 585, { color: C.q, lw: 4, alpha: loopA });
        D.chip('下一个词', 1440, 585, { color: C.q, size: 32, alpha: loopA });
        D.curve(1440, 540, 1360, 380, 60, { color: C.q, lw: 4, alpha: loopA });
        D.text('接到句子末尾，再来一轮', 1470, 460, { size: 28, color: C.q, alpha: loopA, align: 'left' });
        D.text('自回归：一次只生成一个词', 960, 790, { size: 32, color: C.dim, alpha: loopA, weight: 500 });
      }
      // final statement
      const fa = S.p(4, 0.2, 0.6);
      if (fa > 0) {
        D.text('猜得准', 700, 480, { size: 96, weight: 900, color: C.q, alpha: fa, glow: 20 });
        D.text('⟸', 960, 480, { size: 90, color: C.dim, alpha: S.p(4, 0.8, 0.5), fam: MAIN });
        D.text('读得懂', 1220, 480, { size: 96, weight: 900, color: C.k, alpha: S.p(4, 1.2, 0.6), glow: 20 });
        D.text('理解上下文，是一切的关键', 960, 640, { size: 42, color: C.text, alpha: S.p(4, 2.2, 0.6), weight: 500 });
      }
    },
  });

  // ------------------------------------------------------------------ ch2a tokens
  const TOK = ['小猫', '坐', '在', '垫子', '上'];
  const IDS = [3721, 1045, 12, 8830, 57];
  const tokVec = TOK.map((_, i) => { const R = rng(11 + i * 7); return Array.from({ length: 8 }, () => +(R() * 2 - 1).toFixed(1)); });
  add({
    id: 'tokens', chapter: { n: 2, title: '把文字变成数字', sub: '词元与词向量' },
    lines: [
      '但是计算机不认识汉字，它只认识数字。所以第一步，是把句子切成一个个小块，叫做 token，也就是"词元"。',
      '每个词元都能在一张巨大的词表里，查到自己的编号。比如"小猫"是 3721 号。',
      '但编号本身没有意义：3721 号并不会比 3720 号更像一只猫。',
      '于是，我们给每个词元分配一串数字，叫做向量，也叫做"词嵌入"，英文是 embedding。',
    ],
    draw(D, t, S) {
      const cx = 820, y = 300;
      const full = TOK.join('');
      const split = S.p(0, 2.2, 1.0, ease.inOut);
      const a0 = S.p(0, 0, 0.6);
      const lay = Hh.rowX(D, TOK, cx, { size: 56, gap: 40, pad: 28 });
      D.font(56, 500);
      const fw = D.measure(full, 56, 500);
      let acc = cx - fw / 2;
      TOK.forEach((tk, i) => {
        const w = D.measure(tk, 56, 500);
        const packed = acc + w / 2; acc += w;
        const x = lerp(packed, lay.xs[i], split);
        const ww = lay.ws[i] * split;
        if (split > 0) D.box(x - ww / 2, y - 48, ww, 96, { r: 30, fill: hexA(C.blue, 0.2), stroke: C.blue, lw: 2.5, alpha: a0 * split });
        D.text(tk, x, y + 2, { size: 56, weight: 500, alpha: a0 });
        if (i > 0) { const cut = prog(t, S.cue(0) + 1.6 + i * 0.1, 0.5); if (cut > 0 && cut < 1) D.line(packed - w / 2, y - 70, packed - w / 2, y + 70, { color: C.q, lw: 4, alpha: (1 - cut) }); }
      });
      D.text('词元 (token)', cx, 190, { size: 34, color: C.dim, alpha: S.p(0, 2.8, 0.6), weight: 700 });
      // ids
      const vecP = S.p(3, 0.4, 1.0, ease.inOut);
      TOK.forEach((tk, i) => {
        const a = S.p(1, 0.6 + i * 0.25, 0.5) * (1 - vecP);
        D.arrow(lay.xs[i], y + 55, lay.xs[i], y + 120, { color: C.q, lw: 3, alpha: a, head: 12 });
        D.text('#' + IDS[i], lay.xs[i], y + 160, { size: 36, fam: MONO, color: C.q, alpha: a, weight: 900 });
      });
      // vocabulary card
      const vA = S.p(1, 0.2, 0.6) * (1 - S.p(3, 0, 0.6));
      if (vA > 0) {
        Hh.panel(D, 1420, 170, 400, 560, { title: '词表', color: C.q, alpha: vA });
        const rows = [['0', '<开始>'], ['12', '在'], ['57', '上'], ['1045', '坐'], ['……', ''], ['3720', '小狗'], ['3721', '小猫'], ['……', ''], ['8830', '垫子'], ['50000+', '…']];
        rows.forEach(([id, w], k) => {
          const hl = id === '3721' ? 0.5 + 0.5 * Math.sin(t * 5) : 0;
          if (hl) D.box(1440, 225 + k * 48, 360, 44, { r: 8, fill: hexA(C.q, 0.25 + 0.2 * hl), alpha: vA * S.p(1, 1.0) });
          D.text(id, 1470, 247 + k * 48, { size: 28, fam: MONO, color: C.q, align: 'left', alpha: vA });
          D.text(w, 1780, 247 + k * 48, { size: 28, align: 'right', alpha: vA });
        });
      }
      // meaningless ids
      const mA = S.p(2, 0, 0.6) * S.gone(3, 0, 0.5);
      if (mA > 0) {
        D.text('#3720 小狗', 560, 640, { size: 52, fam: MONO, color: C.dim, alpha: mA });
        D.text('#3721 小猫', 1080, 640, { size: 52, fam: MONO, color: C.q, alpha: mA });
        D.text('只差 1，含义毫无关系', 820, 740, { size: 38, color: C.red, alpha: S.p(2, 1.4, 0.5) * mA, weight: 700 });
        const xp = S.p(2, 1.0, 0.4);
        D.line(740, 610, 900, 670, { color: C.red, lw: 6, alpha: xp * mA }); D.line(740, 670, 900, 610, { color: C.red, lw: 6, alpha: xp * mA });
      }
      // vectors
      if (vecP > 0) {
        TOK.forEach((tk, i) => {
          D.vec(tokVec[i], lay.xs[i] - 22, 400, { dir: 'col', cell: 44, numbers: true, p: vecP, alpha: vecP });
        });
        const la = S.p(3, 1.4, 0.6);
        D.text('每个词元 → 一个向量（一串数字）', 1500, 520, { size: 36, weight: 700, color: C.q, alpha: la });
        D.text('embedding / 词嵌入', 1500, 580, { size: 32, color: C.dim, alpha: la });
        D.text('这些数字一开始是随机的，', 1500, 680, { size: 30, color: C.dim, alpha: S.p(3, 2.4, 0.6) });
        D.text('在训练中被慢慢学出来', 1500, 725, { size: 30, color: C.dim, alpha: S.p(3, 2.4, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch2b embedding space
  const PTS = [
    ['猫', 2.0, 1.5, 0.5, 0], ['狗', 2.5, 1.1, 0.9, 0], ['兔子', 1.6, 2.0, 0.1, 0], ['老虎', 2.7, 2.1, 1.3, 0],
    ['苹果', -2.1, 1.4, -0.4, 1], ['香蕉', -2.6, 0.9, 0.1, 1], ['橙子', -1.7, 0.7, -0.9, 1], ['葡萄', -2.4, 1.9, -1.1, 1],
    ['汽车', 0.6, -2.1, 1.6, 2], ['火车', 1.2, -2.5, 1.0, 2], ['飞机', 0.1, -2.7, 2.1, 2],
    ['国王', -0.5, -1.2, -2.2, 3], ['女王', -1.4, -1.6, -2.4, 3], ['男人', 0.3, -0.5, -1.6, 3], ['女人', -0.6, -0.9, -1.8, 3],
  ];
  const GROUPS = [['动物', C.q], ['水果', C.v], ['交通工具', C.k], ['人物', C.pink]];
  add({
    id: 'space',
    lines: [
      '你可以把向量想象成空间里的一个点。意思相近的词，在空间里住得很近：猫和狗是邻居，苹果和香蕉是邻居。',
      '更神奇的是，方向也有含义。用"国王"减去"男人"，再加上"女人"，结果非常接近"女王"！',
      '"男人"到"女人"的这个方向，好像代表着"性别"；"男人"到"国王"的方向，好像代表着"皇室"。',
      '当然，真实模型里的向量不止两三维，而是成百上千维。比如 GPT-3，每个词元是一个一万两千多维的向量。',
    ],
    draw(D, t, S) {
      const cloudA = S.p(0, -0.5, 0.8) * S.gone(1, 0, 0.7);
      if (cloudA > 0) {
        const ang = 0.5 + 0.18 * t, tilt = 0.32, sc = 100, cx = 960, cy = 575;
        const proj = (x, y, z) => {
          const x1 = x * Math.cos(ang) + z * Math.sin(ang), z1 = -x * Math.sin(ang) + z * Math.cos(ang);
          const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt), z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
          const f = 9 / (9 + z2);
          return [cx + x1 * sc * f, cy - y1 * sc * f, z2, f];
        };
        [[3.2, 0, 0], [0, 3.2, 0], [0, 0, 3.2]].forEach(([x, y, z]) => {
          const a = proj(-x, -y, -z), b = proj(x, y, z);
          D.line(a[0], a[1], b[0], b[1], { color: C.faint, lw: 2, alpha: cloudA });
        });
        // cluster halos
        const hA = S.p(0, 3.5, 0.8) * cloudA;
        GROUPS.forEach(([name, col], g) => {
          const ps = PTS.filter(p => p[4] === g).map(p => proj(p[1], p[2], p[3]));
          const mx = ps.reduce((a, p) => a + p[0], 0) / ps.length, my = ps.reduce((a, p) => a + p[1], 0) / ps.length;
          D.circle(mx, my, 120, { fill: hexA(col, 0.10), stroke: hexA(col, 0.5), lw: 2, alpha: hA });
          D.text(name, mx, my - 135, { size: 30, color: col, weight: 700, alpha: hA });
        });
        const order = PTS.map((p, i) => ({ p, q: proj(p[1], p[2], p[3]), i })).sort((a, b) => b.q[2] - a.q[2]);
        for (const { p, q, i } of order) {
          const a = S.p(0, 0.2 + i * 0.08, 0.5) * cloudA;
          const col = GROUPS[p[4]][1];
          D.circle(q[0], q[1], 11 * q[3], { fill: col, alpha: a, glow: 10 });
          D.text(p[0], q[0] + 18, q[1] - 16, { size: 30 * q[3], align: 'left', alpha: a, weight: 700 });
        }
      }
      // analogy
      const anA = S.p(1, 0.3, 0.8) * S.gone(3, 0, 0.7);
      if (anA > 0) {
        const P = { 男人: [620, 720], 女人: [620, 430], 国王: [1240, 720], 女王: [1240, 430] };
        const eq = S.p(1, 0.5, 0.6);
        D.rich([{ s: '国王', color: C.pink, weight: 900 }, { s: ' − ', fam: MAIN }, { s: '男人', color: C.k, weight: 900 }, { s: ' + ', fam: MAIN }, { s: '女人', color: C.v, weight: 900 }, { s: ' ≈ ', fam: MAIN }, { s: '女王', color: C.q, weight: 900 }], 960, 220, { size: 64, alpha: anA * eq });
        const pa = S.p(1, 1.4, 0.5);
        Object.entries(P).forEach(([k, [x, y]], i) => {
          const col = { 男人: C.k, 女人: C.v, 国王: C.pink, 女王: C.q }[k];
          D.circle(x, y, 14, { fill: col, alpha: anA * pa, glow: 12 });
          D.text(k, x + (x < 900 ? -30 : 30), y, { size: 40, weight: 700, align: x < 900 ? 'right' : 'left', alpha: anA * pa });
        });
        const g1 = S.raw(1, 2.4, 1.0);
        D.arrow(620, 700, 620, 452, { color: C.v, lw: 5, p: ease.out(g1), alpha: anA });
        const g2 = S.raw(1, 3.8, 1.3);
        const mv = ease.inOut(g2);
        D.arrow(lerp(620, 1240, mv), 700, lerp(620, 1240, mv), 452, { color: C.v, lw: 5, alpha: anA * clamp(g2 * 3), dash: [12, 10] });
        const hit = S.p(1, 5.3, 0.6);
        D.circle(1240, 430, 30 + 20 * hit, { stroke: C.q, lw: 4, alpha: anA * hit * (1 - 0.5 * hit) });
        // directions labels
        const dl = S.p(2, 0, 0.6);
        D.text('性别方向', 580, 575, { size: 32, color: C.v, alpha: anA * dl, align: 'right', weight: 700 });
        D.arrow(645, 720, 1215, 720, { color: C.pink, lw: 5, p: S.p(2, 2.2, 1.0), alpha: anA });
        D.text('皇室方向', 930, 770, { size: 32, color: C.pink, alpha: anA * S.p(2, 2.8, 0.6), weight: 700 });
        D.arrow(645, 430, 1215, 430, { color: C.pink, lw: 5, p: S.p(2, 3.4, 1.0), alpha: anA * 0.6, dash: [12, 10] });
      }
      // dims
      const dA = S.p(3, 0.2, 0.6);
      if (dA > 0) {
        const cols = 128, rows = 96, cs = 5.2, gx = 960 - cols * cs / 2, gy = 250;
        const R = rng(99), rev = S.raw(3, 1.8, 2.5);
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= dA;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const v = R() * 2 - 1;
          if ((r * cols + c) / (rows * cols) > rev) continue;
          ctx.fillStyle = E.signed(v); ctx.fillRect(gx + c * cs, gy + r * cs, cs - 1, cs - 1);
        }
        ctx.restore();
        D.text('2 维', 360, 400, { size: 44, fam: MONO, color: C.dim, alpha: dA * S.p(3, 0.4) });
        D.text('3 维', 360, 470, { size: 44, fam: MONO, color: C.dim, alpha: dA * S.p(3, 0.8) });
        D.text('……', 360, 540, { size: 44, color: C.dim, alpha: dA * S.p(3, 1.2) });
        D.text('12,288 维', 1600, 400, { size: 64, fam: MONO, color: C.q, weight: 900, alpha: S.p(3, 3.0, 0.6), glow: 16 });
        D.text('GPT-3 的一个词元', 1600, 480, { size: 34, color: C.text, alpha: S.p(3, 3.2, 0.6) });
        D.text('(128 × 96 个格子)', 1600, 530, { size: 28, color: C.dim, alpha: S.p(3, 3.4, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch3 dot product
  add({
    id: 'dot', chapter: { n: 3, title: '数学小课堂：点积', sub: '注意力机制的核心工具' },
    lines: [
      '在继续之前，我们需要一个简单、却超级重要的数学工具：点积。',
      '两个向量的点积，就是把对应位置的数相乘，再全部加起来。比如这里：2 乘 1，加 1 乘 3，加 3 乘 2，结果是 11。',
      '从几何上看，点积等于两个向量的长度相乘，再乘以它们夹角的余弦。',
      '所以，方向越一致，点积越大；互相垂直时，点积为零；方向相反，点积就变成负数。',
      '换句话说，点积可以衡量两个向量有多"像"。记住这一点，注意力机制就是靠它运转的。',
    ],
    draw(D, t, S) {
      const hA = S.p(0, 0, 0.6);
      D.text('点积  Dot Product', 960, 150, { size: 60, weight: 900, color: C.q, alpha: hA });
      // algebra side
      const lA = S.p(1, 0, 0.6) * (1 - 0.7 * S.p(4, 0, 0.6));
      if (lA > 0) {
        const a = [2, 1, 3], b = [1, 3, 2];
        const x0 = 230, y0 = 330, rh = 100;
        Hh.formula(D, [{ s: 'a', fam: MATH, color: C.q, weight: 700 }, ' · ', { s: 'b', fam: MATH, color: C.k }, ' = ',
          { base: [{ s: 'a', fam: MATH, color: C.q }], sub: ['1'] }, { base: [{ s: 'b', fam: MATH, color: C.k }], sub: ['1'] }, ' + ',
          { base: [{ s: 'a', fam: MATH, color: C.q }], sub: ['2'] }, { base: [{ s: 'b', fam: MATH, color: C.k }], sub: ['2'] }, ' + ',
          { base: [{ s: 'a', fam: MATH, color: C.q }], sub: ['3'] }, { base: [{ s: 'b', fam: MATH, color: C.k }], sub: ['3'] }], 470, 270, { size: 48, alpha: lA });
        D.brackets(x0 - 40, y0 - 10, 80, rh * 3 - 20, { color: C.q, alpha: lA });
        D.brackets(x0 + 80, y0 - 10, 80, rh * 3 - 20, { color: C.k, alpha: lA });
        a.forEach((v, i) => {
          const y = y0 + i * rh + 30;
          const on = S.p(1, 1.2 + i * 0.9, 0.4);
          const act = on * (1 - prog(t, S.cue(1) + 1.2 + (i + 1) * 0.9, 0.4));
          if (act > 0) D.box(x0 - 50, y - 38, 540, 76, { r: 12, fill: hexA(C.yellow, 0.14 * act), alpha: lA });
          D.text(String(v), x0, y, { size: 52, fam: MAIN, color: C.q, alpha: lA });
          D.text(String(b[i]), x0 + 120, y, { size: 52, fam: MAIN, color: C.k, alpha: lA });
          D.text(`→  ${v} × ${b[i]} = ${v * b[i]}`, x0 + 200, y, { size: 44, fam: MAIN, align: 'left', alpha: lA * on });
        });
        const sp = S.p(1, 4.2, 0.6);
        D.line(x0 + 200, y0 + 3 * rh, x0 + 520, y0 + 3 * rh, { color: C.dim, lw: 2, alpha: lA * sp });
        D.text('2 + 3 + 6 = 11', x0 + 200, y0 + 3 * rh + 50, { size: 48, fam: MAIN, align: 'left', color: C.yellow, alpha: lA * sp, glow: 10 });
      }
      // geometry side
      const gA = S.p(2, 0, 0.6) * (1 - 0.7 * S.p(4, 0, 0.6));
      if (gA > 0) {
        const ox = 1340, oy = 600, u = 120;
        D.line(ox - 330, oy, ox + 330, oy, { color: C.faint, lw: 2, alpha: gA });
        D.line(ox, oy - 300, ox, oy + 250, { color: C.faint, lw: 2, alpha: gA });
        const aAng = 0.35, la = 2.4, lb = 2.0;
        const sweep = S.raw(3, 0.3, Math.max(2, S.d(3) - 0.5));
        let bAng = 1.1;
        if (sweep > 0) {
          // 1.1 rad → aligned (0.35) → perpendicular → opposite → back
          const k = sweep * 3;
          if (k < 1) bAng = lerp(1.1, aAng, ease.inOut(k));
          else if (k < 2) bAng = lerp(aAng, aAng + Math.PI / 2, ease.inOut(k - 1));
          else bAng = lerp(aAng + Math.PI / 2, aAng + Math.PI, ease.inOut(k - 2));
        }
        const ax = ox + Math.cos(aAng) * la * u, ay = oy - Math.sin(aAng) * la * u;
        const bx = ox + Math.cos(bAng) * lb * u, by = oy - Math.sin(bAng) * lb * u;
        const th = bAng - aAng;
        const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= gA; ctx.strokeStyle = C.yellow; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ox, oy, 60, -bAng, -aAng, th < 0); ctx.stroke(); ctx.restore();
        D.text('θ', ox + Math.cos((aAng + bAng) / 2) * 90, oy - Math.sin((aAng + bAng) / 2) * 90, { size: 40, fam: MATH, color: C.yellow, alpha: gA });
        D.arrow(ox, oy, ax, ay, { color: C.q, lw: 6, alpha: gA, head: 22 });
        D.arrow(ox, oy, bx, by, { color: C.k, lw: 6, alpha: gA, head: 22 });
        D.text('a', ax + 26, ay - 10, { size: 48, fam: MATH, color: C.q, alpha: gA });
        D.text('b', bx + (bx > ox ? 26 : -26), by - 20, { size: 48, fam: MATH, color: C.k, alpha: gA });
        Hh.formula(D, [{ s: 'a', fam: MATH, color: C.q }, ' · ', { s: 'b', fam: MATH, color: C.k }, ' = |', { s: 'a', fam: MATH, color: C.q }, '| |', { s: 'b', fam: MATH, color: C.k }, '| cos ', { s: 'θ', fam: MATH, color: C.yellow }], ox, 290, { size: 52, alpha: gA * S.p(2, 0.8, 0.6) });
        // live readout
        const rA = S.p(3, 0, 0.5) * gA;
        if (rA > 0) {
          const dot = la * lb * Math.cos(th);
          const deg = Math.round(Math.abs(th) * 180 / Math.PI);
          const col = dot > 0.3 ? C.v : dot < -0.3 ? C.red : C.dim;
          D.text(`θ = ${deg}°`, ox - 200, 880, { size: 40, fam: MONO, alpha: rA, color: C.yellow });
          D.text(`a·b = ${dot >= 0 ? '+' : ''}${dot.toFixed(2)}`, ox + 130, 880, { size: 40, fam: MONO, alpha: rA, color: col, weight: 900 });
          const tag = deg < 20 ? '同向：最大！' : Math.abs(deg - 90) < 12 ? '垂直：零' : deg > 160 ? '反向：负数' : '';
          if (tag) D.chip(tag, ox, 800, { color: col, size: 34, alpha: rA });
        }
      }
      const fA = S.p(4, 0.3, 0.6);
      if (fA > 0) {
        D.box(460, 420, 1000, 200, { r: 30, fill: 'rgba(10,14,34,0.92)', stroke: C.q, lw: 3, alpha: fA, glow: 20 });
        D.rich([{ s: '点积大', color: C.v, weight: 900 }, { s: '  =  ' }, { s: '方向像', color: C.v, weight: 900 }, { s: '  =  ' }, { s: '更相关', color: C.q, weight: 900 }], 960, 522, { size: 64, alpha: fA });
      }
    },
  });

  // ------------------------------------------------------------------ ch4 context
  const S8 = ['小猫', '没有', '跳上', '桌子', '因为', '它', '太累', '了'];
  add({
    id: 'context', chapter: { n: 4, title: '上下文的难题', sub: '一个词的意思，取决于它的邻居' },
    lines: [
      '现在看两个句子："我今天吃了一个苹果"，和"苹果发布了新款手机"。',
      '同一个"苹果"，一个是水果，一个是公司。可是查表的时候，它们拿到的是一模一样的向量。',
      '要理解一个词，就必须看它周围的词："吃了"告诉我们这是水果，"发布"和"手机"告诉我们这是公司。',
      '在 Transformer 之前，流行的方法叫循环神经网络，RNN。它像传话游戏一样，一个词一个词地往后读，把信息压缩进一个小本子里往下传。',
      '问题是，句子一长，前面的信息就会慢慢被遗忘；而且必须排着队一个一个算，非常慢。',
      'Transformer 的想法非常大胆：干脆让每个词同时看向所有其他的词，自己决定该关注谁。这，就是注意力。',
    ],
    draw(D, t, S) {
      const s1 = ['我', '今天', '吃了', '一个', '苹果'], s2 = ['苹果', '发布了', '新款', '手机'];
      const topA = S.p(0, 0, 0.6) * S.gone(3, 0, 0.6);
      const L1 = Hh.rowX(D, s1, 900, { size: 44 }), L2 = Hh.rowX(D, s2, 900, { size: 44 });
      const y1 = 250, y2 = 430;
      if (topA > 0) {
        s1.forEach((w, i) => D.chip(w, L1.xs[i], y1, { size: 44, color: w === '苹果' ? C.red : C.blue, alpha: topA * S.p(0, 0.2 + i * 0.1, 0.4) }));
        s2.forEach((w, i) => D.chip(w, L2.xs[i], y2, { size: 44, color: w === '苹果' ? C.red : C.blue, alpha: topA * S.p(0, 2.0 + i * 0.1, 0.4) }));
        // shared vector
        const vA = S.p(1, 1.5, 0.6) * S.gone(2, 0.2, 0.6) * topA;
        const v = [0.8, -0.3, 0.5, 0.9, -0.7, 0.2, 0.6, -0.5];
        D.vec(v, 900 - 4 * 57, 640, { cell: 54, alpha: vA, numbers: true });
        D.curve(L1.xs[4] + 40, y1 + 20, 1120, 660, -160, { color: C.red, lw: 4, alpha: vA, p: S.p(1, 1.5, 0.8) });
        D.curve(L2.xs[0], y2 + 40, 680, 630, 60, { color: C.red, lw: 4, alpha: vA, p: S.p(1, 1.5, 0.8) });
        D.text('一模一样的向量！', 900, 760, { size: 44, color: C.red, weight: 700, alpha: vA });
        const iA = S.p(1, 0, 0.6) * topA;
        Hh.apple(D, 1450, y1, 70, iA); Hh.phone(D, 1450, y2, 80, iA);
        D.text('水果', 1540, y1, { size: 36, align: 'left', alpha: iA }); D.text('公司', 1540, y2, { size: 36, align: 'left', alpha: iA });
        // context arcs
        const cA = S.p(2, 0.4, 0.6) * topA;
        D.curve(L1.xs[2], y1 - 38, L1.xs[4], y1 - 38, -70, { color: C.v, lw: 4, p: S.p(2, 0.4, 0.8), alpha: cA });
        D.curve(L2.xs[1], y2 + 38, L2.xs[0], y2 + 38, -60, { color: C.v, lw: 4, p: S.p(2, 2.4, 0.8), alpha: cA });
        D.curve(L2.xs[3], y2 + 38, L2.xs[0], y2 + 38, -110, { color: C.v, lw: 4, p: S.p(2, 3.0, 0.8), alpha: cA });
        D.text('上下文决定含义', 960, 680, { size: 48, color: C.v, weight: 900, alpha: S.p(2, 3.6, 0.6) * topA });
      }
      // RNN
      const rA = S.p(3, 0.4, 0.6) * S.gone(5, 0, 0.6);
      if (rA > 0) {
        D.text('循环神经网络 RNN：一个接一个地读', 960, 200, { size: 44, weight: 900, color: C.k, alpha: rA });
        const xs = S8.map((_, i) => 330 + i * 180);
        const stepT = S.cue(3) + 2.5, dt = 0.8;
        const step = clamp((t - stepT) / dt, 0, S8.length - 1 + 0.999);
        const cur = Math.floor(step), f = step - cur;
        S8.forEach((w, i) => {
          const on = i <= cur ? 1 : 0.35;
          D.chip(w, xs[i], 700, { size: 36, pad: 18, color: C.blue, alpha: rA * on });
          D.box(xs[i] - 60, 420, 120, 110, { r: 18, fill: hexA(C.k, i === cur ? 0.35 : 0.1), stroke: C.k, lw: 2, alpha: rA * on });
          D.text('RNN', xs[i], 475, { size: 28, fam: MONO, color: C.k, alpha: rA * on });
          D.arrow(xs[i], 660, xs[i], 540, { color: C.dim, lw: 3, head: 12, alpha: rA * on });
          if (i < S8.length - 1) D.arrow(xs[i] + 62, 475, xs[i + 1] - 62, 475, { color: C.dim, lw: 3, head: 12, alpha: rA * 0.6 });
        });
        // memory note ball travelling along
        const bx = lerp(xs[cur], xs[Math.min(cur + 1, S8.length - 1)], ease.inOut(f));
        D.circle(bx, 360, 34, { fill: hexA(C.q, 0.25), stroke: C.q, lw: 3, alpha: rA });
        D.text('记忆', bx, 362, { size: 24, color: C.q, alpha: rA, weight: 700 });
        // what the memory holds (older = fainter)
        const mem = S.p(4, 0, 0.6) * rA;
        if (mem > 0) {
          Hh.panel(D, 1400, 780 - 10, 440, 150, { alpha: mem, color: C.q });
          D.text('小本子里还剩：', 1620, 805, { size: 28, color: C.q, alpha: mem, weight: 700 });
          let mx = 1425;
          S8.slice(0, cur + 1).forEach((w, i) => {
            const age = cur - i, keep = Math.pow(0.62, age);
            D.text(w, mx, 870, { size: 26, alpha: mem * clamp(keep + 0.08), align: 'left', weight: 700 });
            mx += D.measure(w, 26, 700) + 10;
          });
          D.text('健忘：前面的词越来越淡', 360, 830, { size: 40, weight: 900, color: C.red, alpha: S.p(4, 0.6, 0.5) * rA, align: 'left' });
          D.text('太慢：必须排队，一步一步算', 360, 895, { size: 40, weight: 900, color: C.red, alpha: S.p(4, 2.6, 0.5) * rA, align: 'left' });
        }
      }
      // Transformer: all to all
      const tA = S.p(5, 0.2, 0.6);
      if (tA > 0) {
        D.text('Transformer：所有词，同时互相看', 960, 200, { size: 48, weight: 900, color: C.q, alpha: tA });
        const L = Hh.rowX(D, S8, 960, { size: 40, gap: 40 });
        const y = 680;
        const ap = S.p(5, 1.0, 1.6);
        for (let i = 0; i < S8.length; i++) for (let j = i + 1; j < S8.length; j++) {
          const span = j - i;
          D.curve(L.xs[i], y - 40, L.xs[j], y - 40, -span * 45, { color: C.k, lw: 2, head: 0, p: ap, alpha: tA * 0.35 });
        }
        const hl = S.p(5, 3.8, 0.8);
        D.curve(L.xs[5], y - 40, L.xs[0], y - 40, 5 * 45, { color: C.q, lw: 6, head: 18, p: hl, alpha: tA });
        S8.forEach((w, i) => D.chip(w, L.xs[i], y, { size: 40, color: i === 5 ? C.q : C.blue, alpha: tA, glow: i === 5 ? 12 * hl : 0 }));
        D.text('注意力 Attention', 960, 820, { size: 56, weight: 900, color: C.q, alpha: S.p(5, 4.6, 0.6), glow: 20 });
      }
    },
  });
})();
