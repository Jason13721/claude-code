const api = require('../../utils/api.js');

Page({
  data: { book: null, credits: 0, affordable: false },

  onLoad(query) {
    this.bookId = query.id;
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      const [bookRes, user] = await Promise.all([
        api.getBook(this.bookId),
        api.ensureLogin()
      ]);
      const credits = user.credits;
      this.setData({
        book: bookRes.book,
        credits,
        affordable: bookRes.book ? credits >= bookRes.book.credits : false
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  async onExchange() {
    wx.showLoading({ title: '兑换中', mask: true });
    try {
      const r = await api.exchangeBook(this.bookId);
      // 同步本地缓存余额
      const app = getApp();
      if (app.globalData.user) app.globalData.user.credits -= r.credits;
      wx.hideLoading();
      wx.showModal({
        title: '兑换成功 🎉',
        content: `已扣 ${r.credits} 书币。请与「${r.ownerName}」约定楼下交接，收到书后在「兑换记录」里确认完成。`,
        confirmText: '查看记录',
        cancelText: '继续逛',
        success: (m) => {
          if (m.confirm) wx.navigateTo({ url: '/pages/orders/orders' });
          else wx.navigateBack();
        }
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '兑换失败', icon: 'none' });
    }
  }
});
