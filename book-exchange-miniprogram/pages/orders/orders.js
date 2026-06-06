const store = require('../../utils/store.js');

Page({
  data: { orders: [] },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ orders: store.getOrders() });
  },

  onConfirm(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认交接',
      content: '确认你已与邻居完成线下交接？',
      success: (m) => {
        if (m.confirm) {
          store.confirmOrder(id);
          wx.showToast({ title: '交接完成 👍', icon: 'success' });
          this.refresh();
        }
      }
    });
  },

  goShelf() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
