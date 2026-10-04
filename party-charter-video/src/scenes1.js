// Scenes: intro, the problem with general LLMs, who & why now, the 1-2-3-4 blueprint.
(function () {
  const E = window.ENGINE, Hh = window.H;
  const { C, clamp, lerp, ease, prog, hexA, MONO, MAIN, rng } = E;
  const add = s => window.SCENES.push(s);

  // dashed rounded box
  function dbox(D, x, y, w, h, color, a, fill = null) {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= a; D.rrect(x, y, w, h, 14);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.setLineDash([12, 9]); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  window.dbox = dbox;

  // ------------------------------------------------------------------ intro
  add({
    id: 'intro', lead: 0.8,
    lines: [
      '1922 年 7 月，中国共产党第二次全国代表大会在上海召开，通过了党的历史上第一部章程。',
      '一百多年后，在首部党章的诞生地，中共二大会址纪念馆，一个新的计划正在酝酿：给党章学习配上一位人工智能"讲解员"。',
      '这个视频根据项目的可行性研究报告，用通俗的方式讲清楚四件事：为什么要做，要做什么，怎么保证它不说错，以及什么时候和大家见面。',
    ],
    draw(D, t, S) {
      // year + shikumen + charter
      const a0 = S.p(0, -0.6, 0.8) * S.gone(1, 0, 0.7);
      if (a0 > 0) {
        D.text('1922', 960, 250, { size: 170, weight: 900, fam: MONO, color: C.q, alpha: a0, glow: 26 });
        D.text('7 月 · 上海', 960, 370, { size: 44, weight: 700, color: C.dim, alpha: a0 * S.p(0, 0.8, 0.6) });
        Hh.shikumen(D, 640, 820, 200, a0 * S.p(0, 1.4, 0.8));
        D.text('中共二大会址', 640, 870, { size: 30, color: C.dim, alpha: a0 * S.p(0, 1.6, 0.6) });
        const pa = S.p(0, 2.6, 0.9);
        Hh.page(D, 1260, 640, 380, 420, { title: '中国共产党章程', lines: 7, alpha: a0 * pa, rot: -0.04 * (1 - pa) + 0.02 });
        Hh.stamp(D, 1380, 760, 62, '首部', C.crimson, a0 * S.p(0, 3.4, 0.4));
        D.text('党的历史上第一部章程', 1260, 890, { size: 34, weight: 700, color: C.q, alpha: a0 * S.p(0, 3.6, 0.6) });
      }
      // AI guide
      const a1 = S.p(1, 0.2, 0.8) * S.gone(2, 0, 0.7);
      if (a1 > 0) {
        Hh.shikumen(D, 520, 760, 230, a1);
        D.text('首部党章诞生地', 520, 820, { size: 32, color: C.dim, alpha: a1 });
        const ga = S.p(1, 2.0, 0.8);
        D.curve(700, 520, 1050, 450, -60, { color: C.q, lw: 4, p: ga, alpha: a1 });
        D.box(1080, 300, 620, 300, { r: 30, fill: 'rgba(52,20,25,0.9)', stroke: C.q, lw: 3, alpha: a1 * ga, glow: 16 });
        D.circle(1170, 400, 46, { fill: hexA(C.q, 0.25), stroke: C.q, lw: 3, alpha: a1 * ga });
        D.text('AI', 1170, 402, { size: 40, weight: 900, fam: MONO, color: C.q, alpha: a1 * ga });
        D.text('人工智能讲解员', 1250, 380, { size: 44, weight: 900, align: 'left', alpha: a1 * ga });
        D.text('随时提问 · 有据可查', 1250, 440, { size: 32, color: C.dim, align: 'left', alpha: a1 * ga });
        for (let i = 0; i < 3; i++) D.circle(1250 + i * 34, 530, 9 + 3 * Math.sin(t * 5 - i), { fill: C.q, alpha: a1 * ga * 0.8 });
        D.text('党章智能体', 1390, 680, { size: 64, weight: 900, color: C.q, alpha: a1 * S.p(1, 3.2, 0.6), glow: 18 });
      }
      // four questions
      const a2 = S.p(2, 0.2, 0.6);
      if (a2 > 0) {
        D.text('本片要回答的四个问题', 960, 230, { size: 48, weight: 900, color: C.q, alpha: a2 });
        const qs = [['为什么要做？', C.red], ['要做什么？', C.q], ['怎么保证不说错？', C.v], ['什么时候见面？', C.k]];
        qs.forEach(([s, c], i) => {
          const p = ease.back(S.raw(2, 1.6 + i * 0.9, 0.6));
          const x = 300 + i * 440;
          D.box(x - 190, 430, 380, 220, { r: 24, fill: hexA(c, 0.12), stroke: c, lw: 3, alpha: a2 * clamp(p) });
          D.text(String(i + 1), x, 495, { size: 56, weight: 900, fam: MONO, color: c, alpha: a2 * clamp(p) });
          D.text(s, x, 590, { size: 38, weight: 900, alpha: a2 * clamp(p) });
        });
      }
    },
  });

  // ------------------------------------------------------------------ ch1 problem
  add({
    id: 'problem', chapter: { n: 1, title: '通用大模型的短板', sub: '为什么不能直接用 ChatGPT 们？' },
    lines: [
      '现在很多人遇到问题，第一反应是去问 AI 大模型。它们知识面很广，回答也很流畅。',
      '但在党史和党章领域，通用大模型常常出错：把不同时期的党章条文混在一起，把年代和人物弄错，还会把研究者的推测说成确定的结论。',
      '为什么会这样？因为大模型本质上是在"续写"最像样的句子，而不是在翻书查证。说得越流畅，错误反而越不容易被发现。',
      '而党章宣传教育对史实准确和表述规范的要求非常高。一次史实错误或表述失当，就可能损害纪念馆的公信力。',
      '所以需要一个专用的智能体：依据权威语料，输出可以溯源，全过程可以审查。',
    ],
    draw(D, t, S) {
      // chat
      const cA = S.p(0, -0.4, 0.6) * S.gone(1, 0, 0.6);
      if (cA > 0) {
        Hh.panel(D, 460, 220, 1000, 520, { alpha: cA, color: C.dim });
        const q = '首部党章是哪一年通过的？';
        const n = Math.floor(clamp((t - S.cue(0) - 0.3) / 1.2) * q.length);
        const qw = D.measure(q, 38, 500) + 60;
        D.box(1420 - qw, 270, qw, 76, { r: 24, fill: hexA(C.k, 0.3), stroke: C.k, alpha: cA });
        D.text(q.slice(0, n), 1420 - qw + 30, 309, { size: 38, align: 'left', weight: 500, alpha: cA });
        const aa = S.p(0, 1.8, 0.5) * cA;
        D.box(500, 390, 760, 300, { r: 24, fill: hexA(C.purple, 0.16), stroke: C.purple, alpha: aa });
        const lines = Math.floor(clamp((t - S.cue(0) - 2.0) / 2.5) * 6);
        for (let i = 0; i < lines; i++) D.line(540, 440 + i * 42, 540 + [640, 600, 680, 560, 620, 420][i], 440 + i * 42, { color: C.purple, lw: 10, alpha: aa * 0.6 });
        D.chip('知识面广', 1340, 470, { size: 30, color: C.v, alpha: S.p(0, 3.0, 0.5) * cA });
        D.chip('回答流畅', 1340, 560, { size: 30, color: C.v, alpha: S.p(0, 3.6, 0.5) * cA });
      }
      // three errors
      const eA = S.p(1, 0.3, 0.6) * S.gone(2, 0, 0.6);
      if (eA > 0) {
        const cards = [['版本混用', '不同时期的条文混在一起'], ['年代人物错置', '时间、人物张冠李戴'], ['推测当结论', '把研究推论说成定论']];
        cards.forEach(([h, s], i) => {
          const p = S.p(1, 1.8 + i * 1.6, 0.6);
          const x = 360 + i * 600;
          D.box(x - 250, 260, 500, 480, { r: 26, fill: 'rgba(52,20,25,0.85)', stroke: C.red, lw: 3, alpha: eA * p });
          // illustration
          if (i === 0) {
            Hh.page(D, x - 70, 420, 150, 190, { title: '甲版本', lines: 4, alpha: eA * p, rot: -0.12 });
            Hh.page(D, x + 70, 430, 150, 190, { title: '乙版本', lines: 4, alpha: eA * p, rot: 0.12 });
            D.text('⇄', x, 430, { size: 60, color: C.red, weight: 900, alpha: eA * p, fam: MAIN });
          } else if (i === 1) {
            const sw = (Math.sin(t * 2) + 1) / 2;
            D.chip('1921', lerp(x - 90, x + 90, sw), 400, { size: 40, color: C.q, alpha: eA * p });
            D.chip('1922', lerp(x + 90, x - 90, sw), 470, { size: 40, color: C.k, alpha: eA * p });
          } else {
            D.text('?', x - 70, 430, { size: 120, weight: 900, color: C.dim, alpha: eA * p });
            D.arrow(x - 20, 430, x + 30, 430, { color: C.red, lw: 5, alpha: eA * p });
            D.text('!', x + 80, 430, { size: 120, weight: 900, color: C.red, alpha: eA * p });
          }
          D.text(h, x, 600, { size: 44, weight: 900, color: C.red, alpha: eA * p });
          D.text(s, x, 670, { size: 30, color: C.dim, alpha: eA * p });
          Hh.cross(D, x + 200, 300, 40, C.red, eA * p);
        });
      }
      // continuation
      const kA = S.p(2, 0.3, 0.6) * S.gone(3, 0, 0.6);
      if (kA > 0) {
        D.text('大模型的工作方式：续写最"像样"的下一个词', 960, 220, { size: 44, weight: 900, color: C.q, alpha: kA });
        D.rich([{ s: '首部党章通过于 ' }, { s: '____', color: C.q, weight: 900 }], 960, 330, { size: 52, alpha: kA * S.p(2, 0.8, 0.5) });
        const opts = [['1922 年', 0.46, true], ['1921 年', 0.31, false], ['1923 年', 0.12, false], ['……', 0.11, false]];
        opts.forEach(([w, p, ok], i) => {
          const y = 440 + i * 80, g = S.p(2, 1.6 + i * 0.2, 0.8);
          D.text(w, 640, y, { size: 38, align: 'right', alpha: kA, weight: 700, color: ok ? C.v : C.text });
          D.box(670, y - 22, 900 * p * 1.4 * g, 44, { r: 8, fill: ok ? C.v : hexA(C.red, 0.75), alpha: kA });
          D.text(`${Math.round(p * 100 * g)}%`, 690 + 900 * p * 1.4 * g, y, { size: 30, fam: MONO, align: 'left', alpha: kA * g });
        });
        D.text('示意数据', 1720, 760, { size: 24, color: C.dim, alpha: kA, align: 'right' });
        D.text('错误答案也可能有很高的概率，而且说得同样流畅', 960, 820, { size: 38, weight: 700, color: C.red, alpha: kA * S.p(2, 4.0, 0.6) });
      }
      // credibility
      const rA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (rA > 0) {
        const crack = S.p(3, 2.6, 0.5);
        const ctx = D.ctx;
        D.circle(960, 470, 190, { fill: hexA(C.q, 0.14), stroke: C.q, lw: 6, alpha: rA, glow: 20 });
        D.text('公信力', 960, 475, { size: 76, weight: 900, color: C.q, alpha: rA });
        ctx.save(); ctx.globalAlpha *= rA * crack; ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.beginPath();
        ctx.moveTo(900, 280); ctx.lineTo(940, 380); ctx.lineTo(905, 440); ctx.lineTo(960, 540); ctx.lineTo(930, 660); ctx.stroke(); ctx.restore();
        D.text('史实准确 · 表述规范', 960, 760, { size: 40, weight: 700, alpha: rA * S.p(3, 1.0, 0.6) });
        D.text('一次错误，就可能伤害它', 960, 830, { size: 34, color: C.red, alpha: rA * crack });
      }
      // three requirements
      const qA = S.p(4, 0.2, 0.6);
      if (qA > 0) {
        D.text('专用智能体的三条要求', 960, 220, { size: 48, weight: 900, color: C.q, alpha: qA });
        [['依据权威语料', '只用经过核校的资料'], ['输出可以溯源', '每句话都能找到出处'], ['全程可以审查', '每一步都留下记录']].forEach(([h, s], i) => {
          const p = S.p(4, 0.8 + i * 0.9, 0.6), x = 420 + i * 540;
          D.box(x - 220, 320 + (1 - p) * 40, 440, 420, { r: 20, fill: hexA(C.q, 0.1), stroke: C.q, lw: 3, alpha: qA * p });
          D.text(['据', '源', '审'][i], x, 450 + (1 - p) * 40, { size: 110, weight: 900, color: C.q, alpha: qA * p });
          D.text(h, x, 600 + (1 - p) * 40, { size: 40, weight: 900, alpha: qA * p });
          D.text(s, x, 660 + (1 - p) * 40, { size: 28, color: C.dim, alpha: qA * p });
        });
      }
    },
  });

  // ------------------------------------------------------------------ ch2 who & why now
  add({
    id: 'who', chapter: { n: 2, title: '谁来做？为什么现在做？', sub: '馆校合作，赶上 105 周年' },
    lines: [
      '项目由三家单位合作：中共二大会址纪念馆提出需求、使用并对外负责；华东师范大学马克思主义学院负责语料建设和史实把关；计算机科学与技术学院负责模型和平台开发。',
      '可以把它想成一个团队：纪念馆是"出题人"和"把关人"，马克思主义学院是"编书人"，计算机学院是"造工具的人"。',
      '为什么要做？纪念馆的观众差别很大：有干部培训班，有大中小学生，也有企事业单位党组织和普通游客。不同的人需要不同深度的讲解，靠现有人手很难一一定制。',
      '传统展陈以单向传播为主：观众看完理解了多少，场馆并不知道。智能体既能按对象生成讲解，也能从观众的提问里了解大家关心什么。',
      '为什么要快？2027 年是中共二大召开和首部党章诞生 105 周年，纪念馆计划改造党章厅，预计 2027 年 11 月前后与观众见面。从确认需求到上线，只有一年左右。',
    ],
    draw(D, t, S) {
      const oA = S.p(0, -0.3, 0.6) * S.gone(2, 0, 0.6);
      if (oA > 0) {
        const orgs = [['中共二大会址纪念馆', '提出需求 · 使用 · 对外负责', '出题人 · 把关人', C.red], ['华东师大马克思主义学院', '语料建设 · 史实核校 · 内容把关', '编书人', C.q], ['华东师大计算机学院', '模型适配 · 平台开发 · 内容安全技术', '造工具的人', C.k]];
        orgs.forEach(([n, r, nick, c], i) => {
          const p = S.p(0, 0.5 + i * 2.2, 0.7), x = 380 + i * 580;
          D.box(x - 260, 220, 520, 560, { r: 26, fill: hexA(c, 0.1), stroke: c, lw: 3, alpha: oA * p });
          if (i === 0) Hh.shikumen(D, x, 470, 130, oA * p);
          else if (i === 1) Hh.tome(D, x, 390, 90, true, c, oA * p);
          else Hh.server(D, x, 410, 150, c, oA * p);
          D.text(n, x, 560, { size: 34, weight: 900, color: c, alpha: oA * p });
          D.text(r, x, 620, { size: 26, color: C.dim, alpha: oA * p });
          const np = S.p(1, 0.6 + i * 1.4, 0.6);
          D.chip(nick, x, 710, { size: 38, color: c, alpha: oA * np, glow: 10 * np });
        });
      }
      // audiences
      const aA = S.p(2, 0.3, 0.6) * S.gone(3, 0, 0.6);
      if (aA > 0) {
        const groups = [['干部培训班', 0.9, C.red], ['大中小学生', 0.45, C.q], ['企事业党组织', 0.7, C.k], ['普通游客', 0.3, C.v]];
        D.text('同一件展品，需要不同深度的讲法', 960, 210, { size: 44, weight: 900, color: C.q, alpha: aA });
        groups.forEach(([g, depth, c], i) => {
          const p = S.p(2, 1.4 + i * 0.8, 0.6), x = 330 + i * 420;
          Hh.crowd(D, x, 420, 70, [c, c, c], aA * p);
          D.text(g, x, 540, { size: 36, weight: 700, alpha: aA * p });
          D.box(x - 30, 600, 60, 240, { r: 10, fill: 'rgba(255,255,255,0.06)', alpha: aA * p });
          D.box(x - 30, 840 - 240 * depth * p, 60, 240 * depth * p, { r: 10, fill: c, alpha: aA * p });
        });
        D.text('讲解深度', 120, 720, { size: 28, color: C.dim, alpha: aA, align: 'left' });
      }
      // one-way vs two-way
      const wA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (wA > 0) {
        D.text('传统展陈：单向', 520, 220, { size: 42, weight: 900, color: C.dim, alpha: wA });
        Hh.page(D, 340, 500, 200, 260, { title: '展板', lines: 5, alpha: wA });
        const f = (t * 0.6) % 1;
        D.arrow(460, 500, 620, 500, { color: C.dim, lw: 5, alpha: wA });
        D.circle(lerp(460, 610, f), 500, 8, { fill: C.dim, alpha: wA });
        Hh.person(D, 720, 520, 110, C.dim, wA);
        D.text('?', 800, 380, { size: 70, weight: 900, color: C.dim, alpha: wA * (0.5 + 0.5 * Math.sin(t * 3)) });
        D.text('看懂了多少？场馆不知道', 520, 720, { size: 32, color: C.dim, alpha: wA });
        const bp = S.p(3, 3.0, 0.6);
        D.text('智能体：双向', 1400, 220, { size: 42, weight: 900, color: C.q, alpha: wA * bp });
        Hh.person(D, 1180, 520, 110, C.q, wA * bp);
        D.box(1480, 420, 200, 180, { r: 30, fill: hexA(C.q, 0.15), stroke: C.q, lw: 3, alpha: wA * bp });
        D.text('AI', 1580, 512, { size: 60, weight: 900, fam: MONO, color: C.q, alpha: wA * bp });
        D.arrow(1260, 470, 1460, 470, { color: C.q, lw: 5, alpha: wA * bp });
        D.arrow(1460, 550, 1260, 550, { color: C.v, lw: 5, alpha: wA * bp });
        D.text('提问', 1360, 435, { size: 28, color: C.q, alpha: wA * bp });
        D.text('按对象讲解', 1360, 595, { size: 28, color: C.v, alpha: wA * bp });
        D.text('从提问中了解观众关心什么', 1400, 720, { size: 32, color: C.q, alpha: wA * S.p(3, 4.4, 0.6) });
      }
      // countdown timeline
      const tA = S.p(4, 0.2, 0.6);
      if (tA > 0) {
        const x0 = 220, x1 = 1700, y = 560;
        const X = m => lerp(x0, x1, (m - 0) / 17); // months from 2026-07
        D.line(x0, y, x1, y, { color: C.faint, lw: 6, alpha: tA });
        const lp = S.raw(4, 0.6, 3.0);
        D.line(x0, y, lerp(x0, x1, lp), y, { color: C.q, lw: 6, alpha: tA });
        const ev = [[0, '2026.7', '发布建设意向', C.dim], [2, '2026.9.2', '三方调研座谈会', C.dim], [6, '2027.1', '一期开工', C.q], [16, '2027.11', '党章厅改造成果开放', C.red]];
        ev.forEach(([m, d, s, c], i) => {
          const a = S.p(4, 0.8 + i * 0.7, 0.5) * tA, x = X(m), up = i % 2 === 0;
          D.circle(x, y, 14, { fill: c, alpha: a, glow: 10 });
          D.line(x, y, x, up ? y - 120 : y + 120, { color: c, lw: 2, alpha: a });
          D.text(d, x, up ? y - 190 : y + 160, { size: 34, fam: MONO, weight: 900, color: c, alpha: a });
          D.text(s, x, up ? y - 145 : y + 205, { size: 28, alpha: a });
        });
        const bA = S.p(4, 4.0, 0.6) * tA;
        D.text('105 周年', 1560, 250, { size: 80, weight: 900, color: C.red, alpha: bA, glow: 20 });
        D.text('中共二大召开 · 首部党章诞生', 1560, 330, { size: 28, color: C.dim, alpha: bA });
        Hh.brace(D, X(2), X(16), y + 260, '从确认需求到上线：约一年', { color: C.q, alpha: S.p(4, 5.5, 0.6) * tA, size: 34 });
      }
    },
  });

  // ------------------------------------------------------------------ ch3 blueprint
  add({
    id: 'blueprint', chapter: { n: 3, title: '总体蓝图：一、二、三、四', sub: '一个底座 · 两个空间 · 三类应用 · 四道关卡' },
    lines: [
      '项目的总体格局，可以用四个数字来记：一个底座、两个空间、三类应用、四道安全关卡。',
      '一个底座，是"党章权威知识底座"。整个项目最核心的成果，就是这一套经过核校、能追溯版本和出处的知识体系。',
      '两个空间：编审发布空间，供馆内人员审核、发布和下线内容；研究空间，供研究人员做跨版本检索和出处核验。',
      '三类应用：随展问章、百年党章对照台，以及党章微课工场。',
      '四道安全关卡：入口关、证据关、生成关和校验关，守在知识底座和应用之间。',
      '最下面的基础模型和上面这些部分是"解耦"的。就像换发动机不用重新造一辆车，以后有了更好的模型，经过测试就能替换。',
    ],
    draw(D, t, S) {
      const nA = S.p(0, 0, 0.6) * S.gone(1, 0, 0.6);
      if (nA > 0) {
        [['一', '个底座', C.q], ['二', '个空间', C.k], ['三', '类应用', C.v], ['四', '道关卡', C.red]].forEach(([n, s, c], i) => {
          const p = ease.back(S.raw(0, 0.8 + i * 0.8, 0.6)), x = 330 + i * 420;
          D.text(n, x, 460, { size: 220, weight: 900, color: c, alpha: nA * clamp(p), glow: 20 });
          D.text(s, x, 650, { size: 46, weight: 700, alpha: nA * clamp(p) });
        });
      }
      const bA = S.p(1, -0.3, 0.6);
      if (bA <= 0) return;
      const LX = 230, X0 = 380, X1 = 1800, W = X1 - X0;
      const row = (label, y, c, a) => { D.text(label, LX, y, { size: 36, weight: 900, color: c, alpha: a }); };
      // base (knowledge)
      const kb = S.p(1, 0, 0.7) * bA;
      const yK = 590;
      D.box(X0, yK, W, 170, { r: 18, fill: hexA(C.q, 0.12), stroke: C.q, lw: 3, alpha: kb, glow: 10 * S.p(1, 0, 1) * (1 - S.p(2, 0, 1)) });
      D.text('党章权威知识底座', X0 + W / 2, yK + 36, { size: 34, weight: 900, color: C.q, alpha: kb });
      ['原始文献层 · 保留原貌', '研究解释层 · 关联作者和证据', '宣教内容层 · 关联依据和审核'].forEach((s, i) => {
        const p = S.p(1, 1.0 + i * 0.4, 0.5);
        D.box(X0 + 30 + i * (W - 60) / 3, yK + 70, (W - 60) / 3 - 20, 80, { r: 12, fill: 'rgba(255,255,255,0.05)', stroke: hexA(C.q, 0.6), lw: 2, alpha: kb * p });
        D.text(s, X0 + 30 + i * (W - 60) / 3 + ((W - 60) / 3 - 20) / 2, yK + 110, { size: 28, alpha: kb * p });
      });
      row('一个底座', yK + 85, C.q, kb);
      // spaces
      const sp = S.p(2, 0, 0.7) * bA, yS = 200 + 130;
      D.box(X0, yS, W * 0.55 - 10, 100, { r: 16, fill: hexA(C.k, 0.14), stroke: C.k, lw: 3, alpha: sp });
      D.text('编审发布空间 · 馆内人员编审、发布、下线', X0 + (W * 0.55 - 10) / 2, yS + 50, { size: 30, weight: 700, alpha: sp });
      dbox(D, X0 + W * 0.55 + 10, yS, W * 0.45 - 10, 100, C.k, sp * S.p(2, 2.5, 0.6));
      D.text('研究空间 · 跨版本检索、出处核验', X0 + W * 0.55 + 10 + (W * 0.45 - 10) / 2, yS + 50, { size: 30, color: C.dim, alpha: sp * S.p(2, 2.5, 0.6) });
      row('两个空间', yS + 50, C.k, sp);
      // apps
      const ap = S.p(3, 0, 0.7) * bA, yA = 200;
      const aw = (W - 40) / 3;
      [['随展问章', true], ['百年党章对照台', true], ['党章微课工场', false]].forEach(([s, solid], i) => {
        const p = S.p(3, 0.6 + i * 0.9, 0.5) * ap, x = X0 + i * (aw + 20);
        if (solid) D.box(x, yA, aw, 100, { r: 16, fill: hexA(C.v, 0.14), stroke: C.v, lw: 3, alpha: p });
        else dbox(D, x, yA, aw, 100, C.v, p);
        D.text(s, x + aw / 2, yA + 50, { size: 34, weight: 900, color: solid ? C.text : C.dim, alpha: p });
      });
      row('三类应用', yA + 50, C.v, ap);
      // gates
      const gp = S.p(4, 0, 0.7) * bA, yG = 460;
      D.box(X0, yG, W, 100, { r: 16, fill: hexA(C.crimson, 0.85), alpha: gp });
      ['入口关', '证据关', '生成关', '校验关'].forEach((s, i) => {
        const p = S.p(4, 0.8 + i * 0.6, 0.4);
        D.text(s, X0 + W / 8 + i * W / 4, yG + 50, { size: 36, weight: 900, alpha: gp * p });
        if (i) D.line(X0 + i * W / 4, yG + 18, X0 + i * W / 4, yG + 82, { color: C.text, lw: 2, alpha: gp * 0.5 });
      });
      row('四道关卡', yG + 50, C.red, gp);
      // model
      const mp = S.p(5, 0, 0.7) * bA, yM = 800;
      const swap = S.p(5, 3.5, 1.4, ease.inOut);
      const ox = swap * 1600;
      D.box(X0 - ox, yM, W, 80, { r: 16, fill: 'rgba(255,255,255,0.06)', stroke: C.dim, lw: 2, alpha: mp * (1 - swap) });
      D.text('基础模型（已备案）', X0 + W / 2 - ox, yM + 40, { size: 32, weight: 700, color: C.dim, alpha: mp * (1 - swap) });
      D.box(X0 + 1600 * (1 - swap), yM, W, 80, { r: 16, fill: hexA(C.v, 0.12), stroke: C.v, lw: 2, alpha: mp * swap });
      D.text('更好的新模型（测试通过后替换）', X0 + W / 2 + 1600 * (1 - swap), yM + 40, { size: 32, weight: 700, color: C.v, alpha: mp * swap });
      row('基础模型', yM + 40, C.dim, mp);
      // legend
      const lg = S.p(2, 3.0, 0.6) * bA * (1 - S.p(5, 0, 0.4));
      D.box(1380, 135, 50, 30, { r: 6, fill: hexA(C.k, 0.14), stroke: C.k, lw: 2, alpha: lg });
      D.text('一期建设', 1446, 150, { size: 26, align: 'left', alpha: lg });
      dbox(D, 1580, 135, 50, 30, C.dim, lg);
      D.text('二期起建设', 1646, 150, { size: 26, align: 'left', alpha: lg });
    },
  });
})();
