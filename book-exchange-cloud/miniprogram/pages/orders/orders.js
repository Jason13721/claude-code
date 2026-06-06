const api = require('../../utils/api.js');
const { fmtTime } = require('../../utils/api.js');

Page({
  data: { orders: [], loading: true },

  onShow() {
    this.refresh();
  },

  async refresh() {
    this.setData({ loading: true });
    try {
      const r = await api.getMine();
      // 顺手刷新本地用户缓存（交接结算后余额会变）
      if (r.user) getApp().globalData.user = r.user;
      const orders = r.orders.map((o) => Object.assign({}, o, { timeText: fmtTime(o.time) }));
      this.setData({ orders, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onConfirm(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认交接',
      content: '确认你已与邻居完成线下交接？',
      success: async (m) => {
        if (!m.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          await api.confirmOrder(id);
          wx.hideLoading();
          wx.showToast({ title: '交接完成 👍', icon: 'success' });
          this.refresh();
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
      }
    });
  },

  goShelf() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
