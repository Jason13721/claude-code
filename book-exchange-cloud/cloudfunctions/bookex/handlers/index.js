// 把所有 action 处理器汇总成一张表，供 ../index.js 路由
module.exports = {
  login: require('./login'),
  getShelf: require('./getShelf'),
  getBook: require('./getBook'),
  getMine: require('./getMine'),
  publishBook: require('./publishBook'),
  exchangeBook: require('./exchangeBook'),
  confirmOrder: require('./confirmOrder'),
  seedBooks: require('./seedBooks')
};
