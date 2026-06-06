const config = require('./config.js');

App({
  globalData: {
    community: config.defaultCommunity,
    user: null // 登录后缓存当前用户资料（含书币余额）
  },
  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '提示',
        content: '当前微信基础库版本过低，无法使用云能力，请把开发者工具的基础库调到 2.2.3 以上。',
        showCancel: false
      });
      return;
    }
    wx.cloud.init({ env: config.env, traceUser: true });
  }
});
