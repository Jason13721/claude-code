// 云函数调用封装：统一走 wx.cloud.callFunction({ name:'bookex', data:{ action, ... } })
function call(action, data) {
  return wx.cloud.callFunction({
    name: 'bookex',
    data: Object.assign({ action }, data || {})
  }).then((res) => {
    const r = res.result;
    if (!r || r.ok === false) {
      throw new Error((r && r.error) || '请求失败，请重试');
    }
    return r;
  });
}

// 确保已登录，结果缓存在 globalData.user
function ensureLogin() {
  const app = getApp();
  if (app.globalData.user) return Promise.resolve(app.globalData.user);
  return call('login', { community: app.globalData.community }).then((r) => {
    app.globalData.user = r.user;
    return r.user;
  });
}

// 把时间戳格式化成 MM-DD HH:mm
function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = {
  call,
  ensureLogin,
  fmtTime,
  getShelf: (community, category) => call('getShelf', { community, category }),
  getBook: (bookId) => call('getBook', { bookId }),
  getMine: () => call('getMine'),
  publishBook: (form) => call('publishBook', { form }),
  exchangeBook: (bookId) => call('exchangeBook', { bookId }),
  confirmOrder: (orderId) => call('confirmOrder', { orderId }),
  seedBooks: (community) => call('seedBooks', { community }),

  // 供 picker 使用的常量（与云端 lib/credit.js 保持一致）
  CATEGORIES: ['绘本启蒙', '桥梁书', '科普百科', '文学读物', '教辅工具'],
  CONDITIONS: ['全新', '九成新', '七成新', '五成新'],
  AGE_RANGES: ['0-3岁', '3-6岁', '6-9岁', '9-12岁', '12岁+']
};
