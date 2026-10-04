// Scenes: two kinds of review, data flow, compliance, phases & budget, acceptance, finale.
(function () {
  const E = window.ENGINE, Hh = window.H;
  const { C, clamp, lerp, ease, prog, hexA, MONO, MAIN } = E;
  const add = s => window.SCENES.push(s);
  const dbox = (...a) => window.dbox(...a);

  // ------------------------------------------------------------------ ch8 two kinds of review
  add({
    id: 'review', chapter: { n: 8, title: '两类内容，两种审核', sub: '资料审定 ≠ 解释也审定' },
    lines: [
      '对外内容分两类管理。第一类是展项讲解、专题解释、版本沿革说明和微课这样的固定宣教内容，每一项都要人工审核、馆方终审，形成发布版本后才对外展示。',
      '第二类是观众的实时问答。核心条文、关键史实和重要解释，优先调用人工审定过的答案；确实需要组织语言的，只能在获准公开的证据范围内生成，并通过校验。',
      '遇到未经审定的重要解释、史料有争议或者证据不足的问题，系统不会硬给一个确定的结论，而是返回有关原文、说明知识的边界，或者转入后台待处理。',
      '这里有一个很重要的道理：资料经过了审定，不等于模型对资料的概括和解释也经过了审定。所以两类内容要分别规定审核方式。',
      '此外，每一次生成都会记录模型版本、提示模板版本、知识版本、所用证据和审查结果，留痕覆盖率达到百分之百，出了问题可以追溯，也可以批量下线。',
    ],
    draw(D, t, S) {
      const A = S.p(0, -0.3, 0.6) * S.gone(3, 0, 0.6);
      if (A > 0) {
        // lane 1
        D.text('第一类 · 固定宣教内容', 960, 170, { size: 38, weight: 900, color: C.k, alpha: A });
        const s1 = ['资料入库\n三级审核', '编写或\n辅助生成初稿', '人工逐项审核\n馆方终审', '形成发布版本\n留存快照', '对外展示'];
        s1.forEach((s, i) => {
          const p = S.p(0, 0.6 + i * 1.0, 0.5) * A, x = 240 + i * 360;
          D.box(x - 150, 220, 300, 120, { r: 16, fill: hexA(C.k, i === 2 ? 0.3 : 0.12), stroke: C.k, lw: i === 2 ? 4 : 2, alpha: p });
          s.split('\n').forEach((l, k) => D.text(l, x, 262 + k * 38, { size: 28, weight: i === 2 ? 900 : 500, alpha: p }));
          if (i < 4) D.arrow(x + 152, 280, x + 206, 280, { color: C.k, lw: 3, head: 10, alpha: p });
        });
        D.line(120, 390, 1800, 390, { color: C.faint, lw: 2, alpha: A });
        // lane 2
        const l2 = S.p(1, 0, 0.6) * A;
        D.text('第二类 · 观众实时问答', 130, 445, { size: 38, weight: 900, color: C.red, alpha: l2, align: 'left' });
        D.box(130, 500, 260, 100, { r: 16, stroke: C.text, lw: 2, alpha: l2 });
        D.text('观众提问', 260, 550, { size: 30, weight: 700, alpha: l2 });
        D.arrow(395, 550, 520, 550, { color: C.text, lw: 3, alpha: l2 });
        D.box(530, 500, 300, 100, { r: 16, fill: C.crimson, alpha: l2 });
        D.text('入口关 · 检索 · 证据关', 680, 550, { size: 26, weight: 900, alpha: l2 });
        D.arrow(835, 530, 1000, 490, { color: C.text, lw: 3, alpha: l2 * S.p(1, 1.5, 0.4) });
        D.arrow(835, 570, 1000, 640, { color: C.text, lw: 3, alpha: l2 * S.p(1, 4.0, 0.4) });
        const b1 = S.p(1, 1.5, 0.6) * A, b2 = S.p(1, 4.0, 0.6) * A;
        D.box(1010, 440, 400, 100, { r: 16, fill: hexA(C.red, 0.14), stroke: C.red, lw: 2, alpha: b1 });
        D.text('优先调用已审定答案', 1210, 475, { size: 28, weight: 900, alpha: b1 });
        D.text('核心条文 · 关键史实', 1210, 512, { size: 22, color: C.dim, alpha: b1 });
        D.box(1010, 590, 400, 100, { r: 16, fill: hexA(C.red, 0.14), stroke: C.red, lw: 2, alpha: b2 });
        D.text('在证据范围内组织语言', 1210, 625, { size: 28, weight: 900, alpha: b2 });
        D.text('生成关约束出处和版本', 1210, 662, { size: 22, color: C.dim, alpha: b2 });
        D.arrow(1415, 490, 1540, 560, { color: C.text, lw: 3, alpha: b1 });
        D.arrow(1415, 640, 1540, 590, { color: C.text, lw: 3, alpha: b2 });
        D.box(1550, 520, 260, 110, { r: 16, fill: C.crimson, alpha: b2 });
        D.text('校验关', 1680, 560, { size: 30, weight: 900, alpha: b2 });
        D.text('通过后才显示', 1680, 598, { size: 22, alpha: b2 });
        // uncertain route
        const u = S.p(2, 0.4, 0.7) * A;
        D.box(130, 740, 860, 110, { r: 16, fill: 'rgba(255,255,255,0.05)', stroke: C.dim, lw: 2, alpha: u });
        D.text('未审定的重要解释 · 史料有争议 · 证据不足', 560, 778, { size: 28, weight: 700, color: C.q, alpha: u });
        D.text('→ 返回原文 / 说明知识边界 / 转后台待处理', 560, 820, { size: 26, alpha: u });
        D.curve(680, 605, 560, 735, 30, { color: C.dim, lw: 3, alpha: u, head: 12 });
        D.text('不硬给结论', 1250, 795, { size: 44, weight: 900, color: C.q, alpha: u * S.p(2, 2.5, 0.6), glow: 12 });
      }
      // key principle
      const kA = S.p(3, 0.2, 0.6) * S.gone(4, 0, 0.6);
      if (kA > 0) {
        Hh.page(D, 560, 500, 340, 420, { title: '资料', lines: 7, alpha: kA });
        Hh.stamp(D, 660, 640, 70, '已审定', C.v, kA * S.p(3, 0.8, 0.4));
        D.arrow(760, 500, 960, 500, { color: C.dim, lw: 5, alpha: kA * S.p(3, 1.6, 0.5) });
        D.text('模型概括', 860, 460, { size: 26, color: C.dim, alpha: kA * S.p(3, 1.6, 0.5) });
        D.box(1000, 330, 400, 340, { r: 22, fill: hexA(C.purple, 0.12), stroke: C.purple, lw: 3, alpha: kA * S.p(3, 2.2, 0.5) });
        D.text('概括和解释', 1200, 400, { size: 36, weight: 900, color: C.purple, alpha: kA * S.p(3, 2.2, 0.5) });
        for (let i = 0; i < 4; i++) D.line(1050, 470 + i * 44, 1350 - (i % 2) * 60, 470 + i * 44, { color: C.purple, lw: 8, alpha: kA * 0.5 * S.p(3, 2.2, 0.5) });
        D.text('?', 1360, 330, { size: 110, weight: 900, color: C.q, alpha: kA * S.p(3, 3.5, 0.5) });
        D.rich([{ s: '资料审定', color: C.v, weight: 900 }, { s: '  ≠  ', fam: MAIN }, { s: '解释也审定', color: C.purple, weight: 900 }], 960, 800, { size: 56, alpha: kA * S.p(3, 4.2, 0.6) });
      }
      // audit trail
      const lA = S.p(4, 0.2, 0.6);
      if (lA > 0) {
        D.box(330, 200, 1260, 560, { r: 22, fill: '#1a0a0d', stroke: C.q, lw: 2, alpha: lA });
        D.text('留痕记录（示意）', 960, 245, { size: 30, weight: 900, color: C.q, alpha: lA });
        const rows = [['时间', '2027-11-xx 10:21:05'], ['模型版本', 'model-v?.?'], ['提示模板版本', 'prompt-v?'], ['知识版本', 'kb-2027.x'], ['所用证据', '[1][2] 出处与页码'], ['审查结果', '四关全部通过']];
        rows.forEach(([k, v], i) => {
          const p = S.p(4, 0.8 + i * 0.7, 0.4);
          D.text(k, 420, 320 + i * 64, { size: 30, fam: MONO, color: C.dim, align: 'left', alpha: lA * p });
          D.text(v, 760, 320 + i * 64, { size: 30, fam: MONO, align: 'left', alpha: lA * p, color: i === 5 ? C.v : C.text });
        });
        const pc = Math.round(100 * ease.out(S.raw(4, 5.0, 1.6)));
        D.text(`留痕覆盖率 ${pc}%`, 960, 830, { size: 52, weight: 900, color: C.q, alpha: lA * S.p(4, 5.0, 0.5), glow: 14 });
      }
    },
  });

  // ------------------------------------------------------------------ ch9 data flow
  add({
    id: 'data', chapter: { n: 9, title: '数据放在哪里？', sub: '部署与数据流转' },
    lines: [
      '数据安全同样关键。知识库、业务后台和日志，都部署在纪念馆指定的环境里，可以是本地机房，也可以是政务云。',
      '公众问答只检索获准公开的资料。内部资料在检索之前就完成权限隔离，不会进入公众问答。',
      '正式运行时，模型推理有两种方式待定：一是在馆方环境内本地部署，资料不出馆；二是调用已备案的模型接口，只发送公开资料片段和观众提问，并约定对方不留存、不用于训练。',
      '高校的算力平台只用于开发和测试，开发环境和正式运行环境分开管理。展厅终端问答不要求注册，也不建立个人画像，语音和提问记录到期删除。',
    ],
    draw(D, t, S) {
      const A = S.p(0, -0.3, 0.6);
      // venue environment
      D.box(560, 170, 820, 700, { r: 26, fill: hexA(C.red, 0.08), stroke: C.red, lw: 3, alpha: A });
      D.text('馆方环境（本地或政务云）', 970, 215, { size: 34, weight: 900, color: C.red, alpha: A });
      // terminals
      const tA = S.p(0, 1.0, 0.6) * A;
      D.box(110, 260, 330, 520, { r: 22, stroke: C.text, lw: 2, alpha: tA });
      D.text('观众和馆员终端', 275, 300, { size: 28, weight: 900, alpha: tA });
      ['展厅触摸屏', '展品二维码', '网站和公众号', '馆员编审后台'].forEach((s, i) => { D.box(140, 340 + i * 105, 270, 80, { r: 12, fill: 'rgba(255,255,255,0.06)', alpha: tA }); D.text(s, 275, 380 + i * 105, { size: 26, alpha: tA }); });
      const f = ((t * 0.5) % 1);
      D.arrow(445, 470, 555, 470, { color: C.text, lw: 3, alpha: tA }); D.arrow(555, 560, 445, 560, { color: C.text, lw: 3, alpha: tA });
      D.circle(lerp(445, 550, f), 470, 6, { fill: C.q, alpha: tA });
      D.text('提问', 500, 440, { size: 22, color: C.dim, alpha: tA }); D.text('回答', 500, 595, { size: 22, color: C.dim, alpha: tA });
      // libraries
      const lA = S.p(1, 0, 0.6) * A;
      D.box(600, 260, 360, 150, { r: 16, stroke: C.v, lw: 3, fill: hexA(C.v, 0.1), alpha: Math.max(lA, A * 0.6) });
      D.text('公开资料库', 780, 315, { size: 30, weight: 900, color: C.v, alpha: Math.max(lA, A * 0.6) });
      D.text('公众问答只检索这里', 780, 360, { size: 22, alpha: lA });
      D.box(980, 260, 360, 150, { r: 16, stroke: C.dim, lw: 2, fill: 'rgba(255,255,255,0.04)', alpha: Math.max(lA, A * 0.6) });
      D.text('内部资料库', 1160, 315, { size: 30, weight: 900, color: C.dim, alpha: Math.max(lA, A * 0.6) });
      D.text('检索前权限隔离', 1160, 360, { size: 22, alpha: lA });
      Hh.lock(D, 1310, 290, 40, C.q, lA);
      D.box(600, 440, 740, 90, { r: 16, stroke: C.q, lw: 2, alpha: A });
      D.text('业务后台 · 编审发布 · 检索 · 四道安全关卡', 970, 485, { size: 26, weight: 700, alpha: A });
      D.box(600, 550, 740, 80, { r: 16, stroke: C.dim, lw: 2, alpha: A });
      D.text('日志与留痕 · 提问记录 · 审查记录 · 发布快照 · 备份', 970, 590, { size: 24, color: C.dim, alpha: A });
      // inference modes
      const mA = S.p(2, 0.2, 0.6) * A;
      dbox(D, 600, 650, 740, 190, C.red, mA);
      D.text('模型推理（两种方式待确定）', 970, 685, { size: 26, weight: 900, color: C.red, alpha: mA });
      const m1 = S.p(2, 1.4, 0.6), m2 = S.p(2, 4.0, 0.6);
      D.box(630, 715, 330, 100, { r: 14, fill: hexA(C.v, 0.12 * (1 + m1)), stroke: C.v, lw: 2, alpha: mA * (0.4 + 0.6 * m1) });
      D.text('方式一：本地部署', 795, 750, { size: 26, weight: 900, alpha: mA * (0.4 + 0.6 * m1) });
      D.text('资料不出馆', 795, 790, { size: 22, color: C.v, alpha: mA * m1 });
      D.box(980, 715, 330, 100, { r: 14, fill: hexA(C.k, 0.12 * (1 + m2)), stroke: C.k, lw: 2, alpha: mA * (0.4 + 0.6 * m2) });
      D.text('方式二：调用已备案接口', 1145, 750, { size: 26, weight: 900, alpha: mA * (0.4 + 0.6 * m2) });
      D.text('只发公开片段 + 提问', 1145, 790, { size: 22, color: C.k, alpha: mA * m2 });
      // external provider
      D.box(1480, 620, 360, 230, { r: 22, fill: 'rgba(255,255,255,0.05)', stroke: C.dim, lw: 2, alpha: mA * m2 });
      D.text('已备案模型服务方', 1660, 665, { size: 28, weight: 900, color: C.dim, alpha: mA * m2 });
      D.text('不留存', 1660, 730, { size: 30, weight: 900, color: C.k, alpha: mA * S.p(2, 6.0, 0.5) });
      D.text('不用于训练', 1660, 780, { size: 30, weight: 900, color: C.k, alpha: mA * S.p(2, 6.5, 0.5) });
      D.arrow(1315, 755, 1475, 755, { color: C.k, lw: 3, alpha: mA * m2, dash: [8, 8] });
      // dev env + privacy
      const dA = S.p(3, 0.2, 0.6) * A;
      D.box(1480, 200, 360, 300, { r: 22, fill: hexA(C.k, 0.1), stroke: C.k, lw: 2, alpha: dA });
      D.text('高校开发测试环境', 1660, 245, { size: 28, weight: 900, color: C.k, alpha: dA });
      ['开发 · 测试 · 领域适配', '只用公开语料和', '馆方书面授权样本', '不保存生产数据'].forEach((s, i) => D.text(s, 1660, 300 + i * 46, { size: 24, alpha: dA }));
      D.line(1440, 180, 1440, 520, { color: C.q, lw: 4, alpha: dA, dash: [10, 8] });
      const pA = S.p(3, 3.5, 0.6);
      if (pA > 0) {
        D.box(110, 800, 330, 100, { r: 16, fill: 'rgba(18,7,10,0.95)', stroke: C.q, lw: 2, alpha: pA });
        D.text('不注册 · 不画像', 275, 832, { size: 28, weight: 900, color: C.q, alpha: pA });
        D.text('记录到期删除', 275, 872, { size: 24, alpha: pA });
      }
    },
  });

  // ------------------------------------------------------------------ ch10 compliance
  add({
    id: 'law', chapter: { n: 10, title: 'AI 也要"持证上岗"', sub: '合规与测试' },
    lines: [
      '生成式人工智能面向公众提供服务，要遵守国家的相关规定，比如《生成式人工智能服务管理暂行办法》和《人工智能生成合成内容标识办法》。',
      '因此，项目要办理备案或登记，在问答界面显著位置公示所用模型的名称和编号，并给 AI 生成的文字和合成语音加上标识，让大家知道哪些内容是人工智能生成的。',
      '还要落实网络安全等级保护、个人信息保护和语料授权。面向观众的开放，包括公开试用，都要等合规手续办结之后才进行。',
      '上线之前还要做"防绕过测试"：准备 200 道有依据题、50 道版本辨析题、50 道证据不足题，以及不少于 30 组越权和注入测试。每次模型或知识更新后，都要重新测一遍。',
    ],
    draw(D, t, S) {
      const rA = S.p(0, -0.2, 0.6) * S.gone(1, 0, 0.6);
      if (rA > 0) {
        ['生成式人工智能服务管理暂行办法', '互联网信息服务深度合成管理规定', '人工智能生成合成内容标识办法'].forEach((s, i) => {
          const p = S.p(0, 0.8 + i * 0.8, 0.6);
          Hh.page(D, 480 + i * 480, 480 + (1 - p) * 40, 380, 470, { title: '', lines: 8, alpha: rA * p, rot: (i - 1) * 0.04 });
          D.text('《' + s + '》', 480 + i * 480, 790, { size: 26, weight: 700, alpha: rA * p });
        });
      }
      const cA = S.p(1, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (cA > 0) {
        const items = [['备案或登记', '面向观众的问答服务', S.p(1, 0.8, 0.4)], ['公示模型名称和编号', '问答界面显著位置', S.p(1, 2.6, 0.4)], ['生成内容标识', '文字 · 合成语音 · 文件', S.p(1, 4.6, 0.4)], ['网络安全等级保护', '平台整体', S.p(2, 0.8, 0.4)], ['个人信息保护', '语音 · 提问记录 · 日志', S.p(2, 1.8, 0.4)], ['语料授权', '出版物和影像资料', S.p(2, 2.8, 0.4)]];
        items.forEach(([h, s, p], i) => {
          const col = i % 2, r = Math.floor(i / 2), x = 300 + col * 700, y = 220 + r * 150;
          D.box(x, y, 640, 120, { r: 18, fill: 'rgba(52,20,25,0.85)', stroke: p > 0.5 ? C.v : C.faint, lw: 2, alpha: cA * clamp(p * 2 + 0.3) });
          D.circle(x + 60, y + 60, 30, { stroke: C.v, lw: 3, alpha: cA * clamp(p * 2 + 0.3) });
          Hh.check(D, x + 60, y + 60, 40, C.v, cA * p);
          D.text(h, x + 120, y + 45, { size: 32, weight: 900, align: 'left', alpha: cA * clamp(p * 2 + 0.3) });
          D.text(s, x + 120, y + 88, { size: 24, color: C.dim, align: 'left', alpha: cA * clamp(p * 2 + 0.3) });
        });
        const bA = S.p(1, 5.6, 0.6) * cA * (1 - S.p(2, 0, 0.5));
        D.chip('内容由人工智能生成', 1600, 120, { size: 30, color: C.q, alpha: bA });
        const gA = S.p(2, 4.0, 0.6) * cA;
        D.box(300, 700, 1340, 110, { r: 20, fill: hexA(C.red, 0.15), stroke: C.red, lw: 3, alpha: gA });
        D.text('手续办结之前：不对观众开放，包括公开试用', 970, 755, { size: 40, weight: 900, color: C.red, alpha: gA });
      }
      const tA = S.p(3, 0.2, 0.6);
      if (tA > 0) {
        D.text('防绕过测试集', 960, 200, { size: 52, weight: 900, color: C.q, alpha: tA });
        const bars = [['有依据题', 200, C.v], ['版本辨析题', 50, C.q], ['证据不足题', 50, C.k], ['越权与注入测试', 30, C.red]];
        bars.forEach(([n, v, c], i) => {
          const p = S.p(3, 0.8 + i * 0.7, 0.9), y = 330 + i * 120;
          D.text(n, 640, y, { size: 36, weight: 700, align: 'right', alpha: tA });
          D.box(680, y - 30, 4.5 * v * p, 60, { r: 10, fill: c, alpha: tA });
          D.text(`${i === 3 ? '≥ ' : ''}${Math.round(v * p)}${i === 3 ? ' 组' : ' 道'}`, 700 + 4.5 * v * p, y, { size: 36, fam: MONO, weight: 900, align: 'left', alpha: tA * p });
        });
        D.text('↻ 每次更新模型或知识后，重新测试', 960, 830, { size: 38, weight: 700, color: C.q, alpha: tA * S.p(3, 4.5, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch11 phases & budget
  const PH = [['前期准备', '2026.10–12', C.dim], ['一期 · 打底', '2027.1–11', C.red], ['二期 · 叠加', '2027.12–2028.11', C.k], ['三期 · 推广', '2028.12–2029.9', C.q]];
  const BUD = [['语料与知识底座', [15, 12, 8], C.q], ['平台与应用开发', [18, 18, 14], C.red], ['算力与设备', [8, 6, 6], C.k], ['安全评测与合规', [5, 5, 5], C.v], ['部署与培训推广', [2, 4, 6], C.purple], ['运维保障', [1, 4, 8], C.pink], ['其他', [1, 1, 3], C.dim]];
  add({
    id: 'plan', chapter: { n: 11, title: '分三期建设', sub: '总体规划 · 分期实施 · 小切口先行' },
    lines: [
      '整个项目按照"总体规划、分期实施、小切口先行"的原则推进，总周期大约 36 个月。',
      '前期准备在 2026 年 10 月到 12 月：签署需求确认书，确定合规路径、推理方式和签约主体。',
      '一期"打底"：2027 年 4 月语料封版，6 月拿出内部测试版，9 月预验收并办结手续，11 月随党章厅改造成果一起开放。',
      '二期"叠加"：建设研究空间和党章微课工场，增加数字人和短视频能力。三期"推广"：向静安区其他红色场馆和大中小学推广，形成标准规范，完成总体验收。',
      '二期和三期都以一期的评估结果和经费落实为前提，每期评估通过后，才启动下一期。',
      '项目现金支出总额约 150 万元，分三期，每期约 50 万元，最大的两项是平台与应用开发，以及语料与知识底座建设。目前经费来源还在申请和协调中。',
    ],
    draw(D, t, S) {
      const A = S.p(0, -0.2, 0.6) * S.gone(5, 0, 0.6);
      if (A > 0) {
        // months from 2026-10 → 2029-09 (36 months)
        const x0 = 160, x1 = 1760, y = 500, X = m => lerp(x0, x1, m / 36);
        const seg = [[0, 3], [3, 15], [15, 27], [27, 36]];
        seg.forEach(([a, b], i) => {
          const p = S.p(i === 0 ? 0 : i === 1 ? 2 : 3, i === 3 ? 3.5 : 0.3, 0.8) * A;
          const sh = i === 0 ? Math.max(p, S.p(1, 0, 0.6) * A) : p;
          const [n, d, c] = PH[i];
          D.box(X(a) + 2, y - 45, (X(b) - X(a) - 4) * Math.max(sh, S.p(0, 1.5 + i * 0.4, 0.6) * 0.25), 90, { r: 10, fill: i === 1 ? C.crimson : hexA(c, 0.25), stroke: c, lw: 2, alpha: A });
          D.text(n, (X(a) + X(b)) / 2, y, { size: i === 0 ? 26 : 34, weight: 900, alpha: A * clamp(sh * 2 + S.p(0, 1.5 + i * 0.4, 0.6) * 0.4) });
          D.text(d, (X(a) + X(b)) / 2, y + 80, { size: 24, fam: MONO, color: C.dim, alpha: A * clamp(sh * 2) });
        });
        D.text('总周期约 36 个月', 960, 230, { size: 52, weight: 900, color: C.q, alpha: A * S.p(0, 0.6, 0.6) * S.gone(1, 0, 0.5) });
        // phase-1 milestones
        const ms = [[2, '2026.12', '需求确认书'], [6, '2027.4', '语料封版'], [8, '2027.6', '内部测试版'], [11, '2027.9', '预验收 · 手续办结'], [13, '2027.11', '随党章厅开放']];
        ms.forEach(([m, d, s], i) => {
          const p = (i === 0 ? S.p(1, 1.5, 0.5) : S.p(2, 0.8 + (i - 1) * 1.2, 0.5)) * A, x = X(m);
          const tier = [0, 1, 2, 0, 1][i], top = y - 100 - tier * 85;
          D.circle(x, y - 45, 9, { fill: C.q, alpha: p });
          D.line(x, y - 45, x, top, { color: C.q, lw: 2, alpha: p });
          D.text(d, x, top - 52, { size: 26, fam: MONO, weight: 900, color: C.q, alpha: p });
          D.text(s, x, top - 20, { size: 24, alpha: p });
        });
        // phase cards
        const cards = [['一期 · 打底', ['知识底座基础版', '编审发布空间', '随展问章 · 对照台', '四道关卡和合规手续'], C.red, 2], ['二期 · 叠加', ['研究空间 · 微课工场', '语料扩充 · 领域适配', '数字人和短视频'], C.k, 3], ['三期 · 推广', ['其他红色场馆接入', '学校和基层党组织', '标准规范 · 总体验收'], C.q, 3]];
        cards.forEach(([h, ls, c, li], i) => {
          const p = S.p(li, i === 0 ? 2.0 : i === 1 ? 0.5 : 3.8, 0.6) * A, x = 200 + i * 520;
          D.box(x, 620, 480, 280, { r: 20, fill: hexA(c, 0.1), stroke: c, lw: 2, alpha: p });
          D.text(h, x + 240, 660, { size: 34, weight: 900, color: c, alpha: p });
          ls.forEach((l, k) => D.text(l, x + 240, 715 + k * 44, { size: 26, alpha: p }));
        });
        const gA = S.p(4, 0.3, 0.6) * A;
        if (gA > 0) {
          [1, 2].forEach(k => {
            const x = 200 + k * 520 - 20;
            D.circle(x, 760, 34, { fill: '#12070a', stroke: C.q, lw: 3, alpha: gA });
            D.text('评估', x, 762, { size: 20, weight: 900, color: C.q, alpha: gA });
          });
          D.text('评估通过 + 经费落实 → 才启动下一期', 960, 570, { size: 34, weight: 900, color: C.q, alpha: gA * S.p(4, 1.0, 0.6) });
        }
      }
      // budget
      const bA = S.p(5, 0.2, 0.6);
      if (bA > 0) {
        D.text('项目现金支出：约 150 万元', 960, 180, { size: 52, weight: 900, color: C.q, alpha: bA });
        const base = 820, sc = 10.5, bw = 230;
        ['一期', '二期', '三期'].forEach((n, k) => {
          const x = 300 + k * 330;
          let yy = base;
          BUD.forEach(([name, v, c], i) => {
            const p = S.p(5, 0.6 + k * 0.5 + i * 0.12, 0.5);
            const h = v[k] * sc * p;
            D.box(x, yy - h, bw, h - 2, { r: 4, fill: c, alpha: bA });
            if (v[k] >= 5 && p > 0.9) D.text(String(v[k]), x + bw / 2, yy - h / 2, { size: 22, fam: MONO, weight: 900, color: '#1a0a0d', alpha: bA });
            yy -= h;
          });
          D.text(n, x + bw / 2, base + 40, { size: 32, weight: 900, alpha: bA });
          D.text('50 万', x + bw / 2, base - 50 * sc - 30, { size: 30, fam: MONO, weight: 900, color: C.q, alpha: bA * S.p(5, 2.2 + k * 0.3, 0.5) });
        });
        BUD.forEach(([name, v, c], i) => {
          const y = 300 + i * 66, p = S.p(5, 1.5 + i * 0.15, 0.4);
          D.box(1340, y - 16, 32, 32, { r: 6, fill: c, alpha: bA * p });
          D.text(name, 1390, y, { size: 28, align: 'left', alpha: bA * p });
          D.text(String(v[0] + v[1] + v[2]), 1800, y, { size: 28, fam: MONO, align: 'right', color: C.dim, alpha: bA * p });
        });
        D.text('单位：万元 · 金额为规划测算，最终以主管部门核定为准', 1580, 800, { size: 22, color: C.dim, alpha: bA });
        D.text('经费来源：拟申请 / 待协调', 1580, 840, { size: 24, color: C.q, alpha: bA * S.p(5, 5.0, 0.6) });
      }
    },
  });

  // ------------------------------------------------------------------ ch12 acceptance
  add({
    id: 'accept', chapter: { n: 12, title: '怎样才算做好？', sub: '验收标准' },
    lines: [
      '怎样才算合格？一期验收分五类对象分别检查：核心条文资料、动态回答质量、安全与权限、服务性能和业务可用性，不能用总分互相抵消。',
      '比如动态回答，要以每一个事实性命题为单位，检查出处是否真实、版本是否准确、证据能否支持结论。证据支持率不低于百分之九十五，证据不足类问题的恰当处理率不低于百分之九十。',
      '同时还要统计正常问题被误拦截的比例。因为一个什么都回答"我不知道"的系统，虽然很安全，却没有用。不能靠大量拒答来换取安全得分。',
      '验收只使用独立的验收题，由没有直接参与开发的人员来实施，并邀请党史党建专家参加。',
    ],
    draw(D, t, S) {
      const A = S.p(0, -0.2, 0.6) * S.gone(1, 0, 0.6);
      if (A > 0) {
        [['核心条文资料', '逐项核验'], ['动态回答质量', '逐命题检查'], ['安全与权限', '越权注入 + 误拦截'], ['服务性能', '响应 · 并发 · 稳定'], ['业务可用性', '观众和馆员能独立用']].forEach(([h, s], i) => {
          const p = S.p(0, 0.8 + i * 0.6, 0.5) * A, x = 230 + i * 365;
          D.box(x - 160, 330, 320, 340, { r: 22, fill: 'rgba(52,20,25,0.85)', stroke: C.q, lw: 2, alpha: p });
          D.text(String(i + 1), x, 410, { size: 70, weight: 900, fam: MONO, color: C.q, alpha: p });
          D.text(h, x, 520, { size: 32, weight: 900, alpha: p });
          D.text(s, x, 580, { size: 24, color: C.dim, alpha: p });
        });
        D.text('五类分别验收，不用总分相互抵消', 960, 790, { size: 40, weight: 900, color: C.q, alpha: A * S.p(0, 5.0, 0.6) });
      }
      const gA = S.p(1, 0.2, 0.6) * S.gone(2, 0, 0.6);
      if (gA > 0) {
        ['出处真实？', '版本准确？', '证据支持结论？'].forEach((s, i) => {
          const p = S.p(1, 1.0 + i * 1.0, 0.5);
          D.chip(s, 330, 330 + i * 120, { size: 36, color: C.k, alpha: gA * p });
          Hh.check(D, 520, 330 + i * 120, 50, C.v, gA * S.p(1, 1.4 + i * 1.0, 0.4));
        });
        const gauge = (cx, val, label, start) => {
          const p = ease.out(S.raw(1, start, 1.8));
          const ctx = D.ctx; ctx.save(); ctx.globalAlpha *= gA; ctx.lineWidth = 34; ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(cx, 560, 190, Math.PI, 2 * Math.PI); ctx.stroke();
          ctx.strokeStyle = C.v; ctx.beginPath(); ctx.arc(cx, 560, 190, Math.PI, Math.PI + Math.PI * val * p); ctx.stroke(); ctx.restore();
          D.text(`≥ ${Math.round(val * 100 * p)}%`, cx, 520, { size: 70, weight: 900, fam: MONO, color: C.v, alpha: gA * clamp(p * 3) });
          D.text(label, cx, 620, { size: 30, weight: 700, alpha: gA * clamp(p * 3) });
        };
        gauge(1000, 0.95, '命题的证据支持率', 4.0);
        gauge(1520, 0.90, '证据不足类恰当处理率', 6.0);
      }
      const sA = S.p(2, 0.2, 0.6) * S.gone(3, 0, 0.6);
      if (sA > 0) {
        // balance scale
        const tilt = 0.18 * Math.sin((t - S.cue(2)) * 1.2) * (1 - S.p(2, 5.0, 1.0));
        const cx = 960, cy = 380, L = 440;
        D.line(cx, cy, cx, 760, { color: C.dim, lw: 8, alpha: sA });
        D.box(cx - 120, 760, 240, 30, { r: 8, fill: C.dim, alpha: sA });
        const lx = cx - Math.cos(tilt) * L, ly = cy + Math.sin(tilt) * L, rx = cx + Math.cos(tilt) * L, ry = cy - Math.sin(tilt) * L;
        D.line(lx, ly, rx, ry, { color: C.q, lw: 8, alpha: sA });
        D.circle(cx, cy, 16, { fill: C.q, alpha: sA });
        [[lx, ly, '安全', C.red], [rx, ry, '有用', C.v]].forEach(([x, y, s, c]) => {
          D.line(x, y, x - 80, y + 140, { color: C.dim, lw: 2, alpha: sA }); D.line(x, y, x + 80, y + 140, { color: C.dim, lw: 2, alpha: sA });
          D.box(x - 120, y + 140, 240, 90, { r: 16, fill: hexA(c, 0.2), stroke: c, lw: 3, alpha: sA });
          D.text(s, x, y + 185, { size: 44, weight: 900, color: c, alpha: sA });
        });
        D.box(1340, 160, 470, 130, { r: 60, fill: 'rgba(255,255,255,0.08)', stroke: C.dim, lw: 2, alpha: sA * S.p(2, 2.5, 0.5) });
        D.text('"我不知道。"', 1575, 225, { size: 40, color: C.dim, alpha: sA * S.p(2, 2.5, 0.5) });
        D.text('同时统计误拦截率，不能靠拒答换安全分', 960, 880, { size: 38, weight: 900, color: C.q, alpha: sA * S.p(2, 5.0, 0.6) });
      }
      const iA = S.p(3, 0.2, 0.6);
      if (iA > 0) {
        [['开发调试题', C.dim, false], ['固定回归题', C.dim, false], ['独立验收题', C.q, true]].forEach(([s, c, use], i) => {
          const p = S.p(3, 0.5 + i * 0.6, 0.5) * iA, x = 480 + i * 480;
          D.box(x - 180, 300, 360, 200, { r: 20, fill: hexA(c, use ? 0.18 : 0.06), stroke: c, lw: use ? 4 : 2, alpha: p, glow: use ? 16 : 0 });
          D.text(s, x, 400, { size: 40, weight: 900, color: use ? C.q : C.dim, alpha: p });
          if (use) Hh.check(D, x + 150, 300, 50, C.v, p);
        });
        Hh.crowd(D, 760, 700, 80, [C.k, C.k, C.k], iA * S.p(3, 2.4, 0.5));
        D.text('未直接参与开发的人员', 760, 800, { size: 30, alpha: iA * S.p(3, 2.4, 0.5) });
        Hh.crowd(D, 1180, 700, 80, [C.red, C.red], iA * S.p(3, 3.6, 0.5));
        D.text('党史党建专家', 1180, 800, { size: 30, alpha: iA * S.p(3, 3.6, 0.5) });
      }
    },
  });

  // ------------------------------------------------------------------ outro
  add({
    id: 'outro', chapter: { n: 13, title: '总结', sub: '有根有据的党章智能体' },
    lines: [
      '回顾一下：这个项目要做的，是一个"有根有据"的党章智能体。',
      '它以权威知识底座为根基，用检索增强来回答问题，用四道安全关卡和人工审核守住底线，分三期逐步建设。',
      '对观众来说，参观将从被动观看变成主动探究：可以随时提问，得到准确、有出处的回答；不到馆的学校和基层党组织，也能通过线上入口来学习。',
      { t: '让技术服务于准确，让每一个回答都有据可查。谢谢观看！', pause: 2.0 },
    ],
    tail: 3.0,
    draw(D, t, S) {
      const A = S.p(0, -0.2, 0.6) * S.gone(2, 0, 0.6);
      if (A > 0) {
        // tree-like recap: roots = knowledge base
        D.text('有根有据', 960, 230, { size: 96, weight: 900, color: C.q, alpha: A, glow: 24 });
        const items = [['权威知识底座', '根基', C.q], ['检索增强生成', '方法', C.k], ['四道关卡 + 人工审核', '底线', C.red], ['三期建设', '节奏', C.v]];
        items.forEach(([s, tag, c], i) => {
          const p = S.p(1, 0.3 + i * 1.6, 0.6) * A, x = 300 + i * 440;
          D.box(x - 200, 400, 400, 260, { r: 24, fill: hexA(c, 0.12), stroke: c, lw: 3, alpha: p });
          D.text(tag, x, 470, { size: 56, weight: 900, color: c, alpha: p });
          D.text(s, x, 580, { size: 32, weight: 700, alpha: p });
        });
      }
      const vA = S.p(2, 0.2, 0.6) * S.gone(3, -0.2, 0.6);
      if (vA > 0) {
        D.text('被动观看', 520, 300, { size: 56, weight: 900, color: C.dim, alpha: vA });
        D.arrow(760, 300, 1140, 300, { color: C.q, lw: 6, alpha: vA * S.p(2, 1.0, 0.8), p: S.p(2, 1.0, 0.8) });
        D.text('主动探究', 1400, 300, { size: 56, weight: 900, color: C.q, alpha: vA * S.p(2, 1.6, 0.6), glow: 16 });
        Hh.shikumen(D, 600, 780, 170, vA * S.p(2, 3.0, 0.6));
        D.text('到馆观众', 600, 830, { size: 30, alpha: vA * S.p(2, 3.0, 0.6) });
        Hh.crowd(D, 1300, 700, 90, [C.k, C.q, C.v], vA * S.p(2, 5.0, 0.6));
        D.text('学校 · 基层党组织（线上）', 1300, 830, { size: 30, alpha: vA * S.p(2, 5.0, 0.6) });
        D.curve(760, 620, 1150, 620, -80, { color: C.q, lw: 3, alpha: vA * S.p(2, 5.5, 0.6), p: S.p(2, 5.5, 0.8), head: 14 });
      }
      const fA = S.p(3, -0.1, 1.0);
      if (fA > 0) {
        Hh.shikumen(D, 960, 520, 160, fA * 0.9);
        D.text('让技术服务于准确', 960, 650, { size: 64, weight: 900, color: C.q, alpha: fA, glow: 20 });
        D.text('让每一个回答都有据可查', 960, 740, { size: 52, weight: 900, alpha: S.p(3, 1.4, 0.8) });
        D.text('中共二大与党章研究 AI 智能体项目 · 根据可行性研究报告（2026 年 10 月）制作', 960, 850, { size: 24, color: C.dim, alpha: S.p(3, 2.6, 0.8) });
        const rp = S.raw(3, 0.2, 2.6);
        for (let k = 0; k < 3; k++) { const p = clamp(rp - k * 0.2); if (p > 0 && p < 1) D.circle(960, 450, 100 + p * 900, { stroke: [C.q, C.red, C.q][k], lw: 3, alpha: (1 - p) * 0.5 }); }
      }
    },
  });
})();
