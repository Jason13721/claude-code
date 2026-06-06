// getMine：聚合“我的”页面所需数据 —— 用户资料、我发布的书、订单、书币明细。
module.exports = async function getMine(event, { cloud, openid }) {
  const db = cloud.database();
  const [userR, booksR, ordersR, txR] = await Promise.all([
    db.collection('users').where({ _openid: openid }).get(),
    db.collection('books').where({ ownerOpenid: openid }).get(),
    db.collection('orders').where({ _openid: openid }).get(),
    db.collection('transactions').where({ _openid: openid }).get()
  ]);

  const orders = ordersR.data.sort((a, b) => (b.time || 0) - (a.time || 0));
  const myBooks = booksR.data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const transactions = txR.data.sort((a, b) => (b.time || 0) - (a.time || 0));

  return {
    ok: true,
    user: userR.data[0] || null,
    myBooks,
    orders,
    transactions,
    stats: {
      published: myBooks.length,
      got: orders.filter((o) => o.type === 'get').length
    }
  };
};
