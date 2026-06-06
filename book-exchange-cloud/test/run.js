// 本地验证云函数逻辑：用 mock 顶替 wx-server-sdk，跑真实的 cloudfunctions/bookex 代码。
const path = require('path');
const Module = require('module');
const mock = require('./mock-wx-server-sdk');

// 让云函数里的 require('wx-server-sdk') 拿到我们的 mock
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'wx-server-sdk') return mock;
  return origLoad.apply(this, arguments);
};

const { main } = require(path.join(__dirname, '../cloudfunctions/bookex/index.js'));

// 以指定用户身份调用某个 action
function call(action, data, openid) {
  mock.__setOpenid(openid || 'anonymous');
  return main(Object.assign({ action }, data));
}

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}

const COMM = '阳光花园小区';

(async () => {
  mock.__reset();

  // 1) 登录建档 + 新人礼包
  let r = await call('login', { name: '王爸爸', address: '4栋1单元', community: COMM }, 'wang');
  ok('首次登录建档', r.ok && r.isNew === true && r.user.credits === 30);
  r = await call('login', {}, 'wang');
  ok('再次登录不重复建档', r.ok && r.isNew === false && r.user.credits === 30);

  // 2) 播种演示书
  r = await call('seedBooks', { community: COMM }, 'admin');
  ok('播种 7 本演示书', r.ok && r.inserted === 7);
  r = await call('seedBooks', { community: COMM }, 'admin');
  ok('重复播种幂等(不重复插)', r.ok && r.inserted === 0);

  // 3) 书架：看到 7 本，且都不是自己的
  r = await call('getShelf', { community: COMM, category: '全部' }, 'wang');
  ok('书架显示 7 本', r.ok && r.books.length === 7);
  ok('书架不含自己发布的', r.books.every((b) => b.ownerOpenid !== 'wang'));
  const rabbit = r.books.find((b) => b.title.indexOf('猜猜我有多爱你') >= 0);
  ok('找到《猜猜我有多爱你》且价 10', rabbit && rabbit.credits === 10);

  // 分类筛选
  r = await call('getShelf', { community: COMM, category: '科普百科' }, 'wang');
  ok('按分类筛选(科普百科 3 本)', r.ok && r.books.length === 3);

  // 4) 小区隔离：另一个小区看不到这些书
  r = await call('getShelf', { community: '梅园花园', category: '全部' }, 'wang');
  ok('小区隔离：他乡小区书架为空', r.ok && r.books.length === 0);

  // 5) 兑换 rabbit（10 书币）
  r = await call('exchangeBook', { bookId: rabbit._id }, 'wang');
  ok('兑换成功', r.ok && r.credits === 10);
  r = await call('getMine', {}, 'wang');
  ok('兑换后余额 30-10=20', r.user.credits === 20);
  ok('我的订单出现 1 笔 get/待交接', r.orders.filter((o) => o.type === 'get' && o.status === '待交接').length === 1);
  ok('流水含 兑换 -10', r.transactions.some((t) => t.delta === -10));
  // 贡献方(seed_li)应收到 give 订单
  r = await call('getMine', {}, 'seed_li');
  ok('贡献方收到 give/待交接 订单', r.orders.filter((o) => o.type === 'give' && o.status === '待交接').length === 1);
  ok('交接前贡献方未到账(credits=0)', r.user.credits === 0);
  // 书架里 rabbit 已不在
  r = await call('getShelf', { community: COMM, category: '全部' }, 'wang');
  ok('兑换后书架剩 6 本', r.books.length === 6);

  // 不能兑换自己的书
  let pub = await call('publishBook', { form: { title: '我的测试书', category: '绘本启蒙', ageRange: '3-6岁', condition: '全新', desc: 'x', cover: '📕', color: '#EF7E72' } }, 'wang');
  ok('发布成功(价=12)', pub.ok && pub.credits === 12);
  r = await call('exchangeBook', { bookId: pub.book._id }, 'wang');
  ok('不能兑换自己发布的书', r.ok === false && /自己发布/.test(r.error));
  ok('发布不立即得书币(仍为20)', (await call('getMine', {}, 'wang')).user.credits === 20);
  // 自己发布的书会出现在别人(同小区)书架
  r = await call('login', { name: '邻居小赵', address: '9栋1单元', community: COMM }, 'zhao2');
  r = await call('getShelf', { community: COMM, category: '全部' }, 'zhao2');
  ok('他人能在书架看到我发布的书', r.books.some((b) => b._id === pub.book._id));

  // 6) 余额不足 + 回滚
  // 先把 wang 余额降到 6：兑换一本 14 的(DK)
  let shelf = await call('getShelf', { community: COMM, category: '全部' }, 'wang');
  const dk = shelf.books.find((b) => b.title.indexOf('DK') >= 0);
  await call('exchangeBook', { bookId: dk._id }, 'wang'); // 20-14=6
  ok('再兑换 DK 后余额 6', (await call('getMine', {}, 'wang')).user.credits === 6);
  // 现在尝试兑换一本 10 书币的（买不起）
  shelf = await call('getShelf', { community: COMM, category: '全部' }, 'wang');
  const pricey = shelf.books.find((b) => b.credits >= 10 && b.ownerOpenid !== 'wang');
  const before = mock.__dump();
  r = await call('exchangeBook', { bookId: pricey._id }, 'wang');
  ok('书币不足被拒', r.ok === false && /书币不足/.test(r.error));
  const after = mock.__dump();
  ok('余额未被扣(回滚)', (await call('getMine', {}, 'wang')).user.credits === 6);
  ok('失败兑换未生成订单(回滚)', Object.keys(after.orders).length === Object.keys(before.orders).length);
  ok('失败兑换未锁定书(状态仍 available)', after.books[pricey._id].status === 'available');

  // 7) 确认交接 → 结算给贡献方
  let mine = await call('getMine', {}, 'wang');
  const getOrder = mine.orders.find((o) => o.type === 'get' && o.bookSnapshot.title.indexOf('猜猜') >= 0);
  r = await call('confirmOrder', { orderId: getOrder._id }, 'wang');
  ok('确认交接成功', r.ok === true);
  r = await call('getMine', {}, 'seed_li');
  ok('交接后贡献方到账 +10', r.user.credits === 10);
  ok('贡献方流水含 换出 +10', r.transactions.some((t) => t.delta === 10 && /换出/.test(t.title)));
  ok('贡献方 give 订单已完成', r.orders.find((o) => o.bookSnapshot.title.indexOf('猜猜') >= 0).status === '已完成');
  // 书状态 exchanged
  const dump = mock.__dump();
  const rabbitDoc = Object.values(dump.books).find((b) => b.title.indexOf('猜猜') >= 0);
  ok('书状态变为 exchanged', rabbitDoc.status === 'exchanged');

  // 8) 幂等：重复确认不重复结算
  r = await call('confirmOrder', { orderId: getOrder._id }, 'wang');
  ok('重复确认返回 already', r.ok === true);
  r = await call('getMine', {}, 'seed_li');
  ok('重复确认未重复结算(仍为10)', r.user.credits === 10);

  // 9) 未知 action
  r = await call('noSuchAction', {}, 'wang');
  ok('未知 action 安全返回', r.ok === false && /未知的 action/.test(r.error));

  console.log(`\n=== 云函数逻辑验证：${pass} 通过 / ${fail} 失败 ===`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('运行异常：', e); process.exit(1); });
