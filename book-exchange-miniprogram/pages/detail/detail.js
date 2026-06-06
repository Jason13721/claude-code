const store = require('../../utils/store.js');

Page({
  data: {
    book: null,
    credits: 0,
    affordable: true
  },

  onLoad(query) {
    const book = store.getBook(query.id);
    this.setData({ book });
  },

  onShow() {
    const credits = store.getUser().credits;
    this.setData({
      credits,
      affordable: this.data.book ? credits >= this.data.book.credits : false
    });
  },

  onExchange() {
    const res = store.exchangeBook(this.data.book.id);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none' });
      return;
    }
    wx.showModal({
      title: '兑换成功 🎉',
      content: `已扣 ${this.data.book.credits} 书币。请与「${this.data.book.owner.name}」约定楼下交接，收到书后在「兑换记录」里确认完成。`,
      confirmText: '查看记录',
      cancelText: '继续逛',
      success: (m) => {
        if (m.confirm) {
          wx.navigateTo({ url: '/pages/orders/orders' });
        } else {
          wx.navigateBack();
        }
      }
    });
  }
});
