// 端到端契约测试：模拟“小程序端 utils/api.js → wx.cloud.callFunction → 真实云函数”，
// 验证云端返回的数据结构，正好是各页面 WXML 所绑定的字段（防止前后端字段对不上）。
const path = require('path');
const Module = require('module');
const mock = require('./mock-wx-server-sdk');

// 让云函数 require('wx-server-sdk') 拿到 mock
const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'wx-server-sdk') return mock;
  return origLoad.apply(this, arguments);
};
const { main } = require(path.join(__dirname, '../cloudfunctions/bookex/index.js'));

// —— 模拟小程序运行时全局 ——
let currentOpenid = 'wang';
const fakeApp = { globalData: { community: '阳光花园小区', user: null } };
global.getApp = () => fakeApp;
global.wx = {
  cloud: {
    callFunction({ name, data }) {
      // callFunction 会带上调用者身份；这里用 currentOpenid 模拟
      mock.__setOpenid(currentOpenid);
      return Promise.resolve(main(data)).then((result) => ({ result }));
    }
  }
};

// 加载真实的小程序端 api 封装
const api = require(path.join(__dirname, '../miniprogram/utils/api.js'));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}
const has = (o, keys) => o && keys.every((k) => o[k] !== undefined);

(async () => {
  mock.__reset();
  const COMM = fakeApp.globalData.community;

  // —— 模拟「书架页 onShow」 ——
  currentOpenid = 'wang';
  const user = await api.ensureLogin();
  ok('ensureLogin 返回用户并缓存', user && fakeApp.globalData.user && user.credits === 30);

  await api.seedBooks(COMM);
  let shelf = await api.getShelf(COMM, '全部');
  ok('getShelf 返回 {books, credits}', Array.isArray(shelf.books) && shelf.credits === 30);
  ok('书架书对象含 WXML 所需字段',
    shelf.books.length > 0 && shelf.books.every((b) => has(b, ['_id', 'title', 'author', 'cover', 'color', 'ageRange', 'condition', 'credits', 'ownerAddress'])));

  // —— 模拟「详情页 → 兑换」 ——
  const target = shelf.books.find((b) => b.title.indexOf('猜猜') >= 0);
  const detail = await api.getBook(target._id);
  ok('getBook 返回详情含 ownerName/ownerAddress/desc/category',
    has(detail.book, ['ownerName', 'ownerAddress', 'desc', 'category', 'credits']));

  const ex = await api.exchangeBook(target._id);
  ok('exchangeBook 返回 {credits, ownerName}', ex.credits === 10 && typeof ex.ownerName === 'string');

  // —— 模拟「兑换记录页」 ——
  let mine = await api.getMine();
  const getOrder = mine.orders.find((o) => o.type === 'get');
  ok('订单含 WXML 所需字段(bookSnapshot/counterparty/credits/status/time)',
    getOrder && has(getOrder, ['_id', 'type', 'credits', 'status', 'time', 'counterparty']) &&
    has(getOrder.bookSnapshot, ['title', 'cover', 'color']));
  ok('fmtTime 能格式化订单时间', /^\d{2}-\d{2} \d{2}:\d{2}$/.test(api.fmtTime(getOrder.time)));

  // —— 模拟「确认交接」 ——
  const conf = await api.confirmOrder(getOrder._id);
  ok('confirmOrder 返回 ok', conf.ok === true);
  mine = await api.getMine();
  ok('确认后该订单已完成', mine.orders.find((o) => o._id === getOrder._id).status === '已完成');

  // —— 模拟「我的页」字段 ——
  ok('getMine 返回 user/myBooks/orders/transactions/stats',
    has(mine, ['user', 'myBooks', 'orders', 'transactions', 'stats']) &&
    has(mine.stats, ['published', 'got']));
  ok('流水含 title/delta/time', mine.transactions.every((t) => has(t, ['title', 'delta', 'time'])));

  // —— 模拟「发布页提交」 ——
  const pub = await api.publishBook({
    title: '团购来的绘本', author: '某某', category: '绘本启蒙',
    ageRange: '3-6岁', condition: '全新', desc: '多了一本', cover: '📕', color: '#EF7E72'
  });
  ok('publishBook 返回 {book, credits}', pub.book && pub.book._id && pub.credits === 12);
  mine = await api.getMine();
  ok('发布后出现在我的书，状态在架',
    mine.myBooks.some((b) => b._id === pub.book._id && b.status === 'available'));

  // —— 错误路径：余额不足时 api 抛出可读错误 ——
  // 把 wang 余额压到不足再兑换一本贵的
  let s2 = await api.getShelf(COMM, '全部');
  // 兑换若干本直到买不起，捕获异常
  let threw = false, lastMsg = '';
  for (const b of s2.books) {
    try { await api.exchangeBook(b._id); }
    catch (e) { threw = true; lastMsg = e.message; break; }
    s2 = await api.getShelf(COMM, '全部');
  }
  ok('余额不足时 api 抛出含「书币不足」的错误', threw && /书币不足/.test(lastMsg));

  console.log(`\n=== 前后端契约验证：${pass} 通过 / ${fail} 失败 ===`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('运行异常：', e); process.exit(1); });
