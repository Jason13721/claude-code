const store = require('../../utils/store.js');

Page({
  data: {
    community: '',
    credits: 0,
    categories: ['全部'],
    active: '全部',
    books: []
  },

  onLoad() {
    this.setData({
      community: store.getCommunity(),
      categories: ['全部'].concat(store.CATEGORIES)
    });
  },

  // 每次回到书架都刷新（兑换/发布后余额、书架会变）
  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      credits: store.getUser().credits,
      books: store.listBooks(this.data.active)
    });
  },

  onTapCategory(e) {
    this.setData({ active: e.currentTarget.dataset.cat }, () => this.refresh());
  },

  onTapBook(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goPublish() {
    wx.switchTab({ url: '/pages/publish/publish' });
  }
});
