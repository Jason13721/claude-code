const api = require('../../utils/api.js');

Page({
  data: {
    community: '',
    credits: 0,
    categories: ['全部'],
    active: '全部',
    books: [],
    loading: true
  },

  onLoad() {
    this.setData({
      community: getApp().globalData.community,
      categories: ['全部'].concat(api.CATEGORIES)
    });
  },

  onShow() {
    this.refresh();
  },

  async onPullDownRefresh() {
    await this.refresh();
    wx.stopPullDownRefresh();
  },

  async refresh() {
    this.setData({ loading: true });
    try {
      const user = await api.ensureLogin();
      let res = await api.getShelf(user.community, this.data.active);
      // 演示便利：默认小区书架为空时自动播种一批演示书
      if (res.books.length === 0 && this.data.active === '全部'
          && user.community === getApp().globalData.community) {
        await api.seedBooks(user.community);
        res = await api.getShelf(user.community, this.data.active);
      }
      const credits = res.credits != null ? res.credits : user.credits;
      getApp().globalData.user.credits = credits;
      this.setData({ credits, books: res.books, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
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
