const store = require('../../utils/store.js');

Page({
  data: {
    user: {},
    community: '',
    myBooks: [],
    transactions: [],
    stats: { published: 0, got: 0 }
  },

  onShow() {
    const orders = store.getOrders();
    this.setData({
      user: store.getUser(),
      community: store.getCommunity(),
      myBooks: store.myBooks(),
      transactions: store.getTransactions(),
      stats: {
        published: orders.filter((o) => o.type === 'give').length,
        got: orders.filter((o) => o.type === 'get').length
      }
    });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  goPublish() {
    wx.switchTab({ url: '/pages/publish/publish' });
  }
});
