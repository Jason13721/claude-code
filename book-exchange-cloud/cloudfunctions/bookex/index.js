// 邻里换书 —— 单一云函数 + action 路由（一个函数好部署，逻辑也好共享）。
// 小程序端通过 wx.cloud.callFunction({ name:'bookex', data:{ action, ... } }) 调用。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const handlers = require('./handlers');

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const handler = handlers[event.action];
  if (!handler) {
    return { ok: false, error: '未知的 action：' + event.action };
  }
  try {
    return await handler(event, { cloud, openid: OPENID });
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
};
