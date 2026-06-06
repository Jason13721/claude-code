// confirmOrder：线下交接完成后确认。结算书币给贡献方，并把书与双方订单置为完成。
// 用“订单是否已完成”做幂等保护，重复点击不会重复结算。
module.exports = async function confirmOrder(event, { cloud }) {
  const db = cloud.database();
  const _ = db.command;

  const orderR = await db.collection('orders').doc(event.orderId).get();
  const order = orderR.data;
  if (!order) throw new Error('订单不存在');
  if (order.status === '已完成') return { ok: true, already: true };

  // 事务外先取贡献方 _id（事务内用 doc 操作）
  const giverR = await db.collection('users').where({ _openid: order.giverOpenid }).get();
  const giver = giverR.data[0];
  // 该书对应的两张订单（领书方 + 贡献方）
  const bothR = await db.collection('orders').where({ bookId: order.bookId }).get();

  await db.runTransaction(async (transaction) => {
    // 再次校验，避免并发下重复结算
    const freshR = await transaction.collection('orders').doc(event.orderId).get();
    if (!freshR.data || freshR.data.status === '已完成') {
      throw new Error('已结算');
    }
    const bookR = await transaction.collection('books').doc(order.bookId).get();
    if (bookR.data && bookR.data.status !== 'exchanged') {
      await transaction.collection('books').doc(order.bookId)
        .update({ data: { status: 'exchanged' } });
    }
    for (const o of bothR.data) {
      if (o.status !== '已完成') {
        await transaction.collection('orders').doc(o._id)
          .update({ data: { status: '已完成' } });
      }
    }
    if (giver) {
      await transaction.collection('users').doc(giver._id)
        .update({ data: { credits: _.inc(order.credits) } });
      await transaction.collection('transactions').add({
        data: { _openid: giver._openid, title: `换出《${order.bookSnapshot.title}》`,
          delta: order.credits, time: Date.now() }
      });
    }
  }).catch((e) => {
    if (e.message === '已结算') return; // 幂等：当作成功
    throw e;
  });

  return { ok: true };
};
