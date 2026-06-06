const api = require('../../utils/api.js');

Page({
  data: {
    user: {},
    community: '',
    myBooks: [],
    transactions: [],
    stats: { published: 0, got: 0 },
    loading: true
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true });
    try {
      const r = await api.getMine();
      if (r.user) getApp().globalData.user = r.user;
      const transactions = r.transactions.map((t) => Object.assign({}, t, { timeText: api.fmtTime(t.time) }));
      this.setData({
        user: r.user || {},
        community: getApp().globalData.community,
        myBooks: r.myBooks,
        transactions,
        stats: r.stats,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  goPublish() {
    wx.switchTab({ url: '/pages/publish/publish' });
  }
});
