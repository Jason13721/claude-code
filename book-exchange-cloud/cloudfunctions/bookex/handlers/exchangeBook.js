// exchangeBook：兑换他人的书。全程放在数据库事务里，保证：
//   校验余额 → 扣领书方书币(冻结) → 锁定书 → 生成双方订单 → 记一笔流水
// 任一步失败整体回滚，杜绝并发下的超扣 / 重复兑换。
// 书币此刻只从领书方扣除（冻结），贡献方要等交接确认后才到账。
module.exports = async function exchangeBook(event, { cloud, openid }) {
  const db = cloud.database();
  const _ = db.command;
  const bookId = event.bookId;

  // 事务内用 doc(id) 取数据，所以先在事务外拿到“我”的 _id
  const meR = await db.collection('users').where({ _openid: openid }).get();
  const me = meR.data[0];
  if (!me) throw new Error('请先登录');

  const result = await db.runTransaction(async (transaction) => {
    const bookR = await transaction.collection('books').doc(bookId).get();
    const book = bookR.data;
    if (!book) throw new Error('书籍不存在');
    if (book.status !== 'available') throw new Error('这本书已被兑换');
    if (book.ownerOpenid === openid) throw new Error('这是你自己发布的书');

    const meDocR = await transaction.collection('users').doc(me._id).get();
    const meNow = meDocR.data;
    if (meNow.credits < book.credits) {
      throw new Error(`书币不足，还差 ${book.credits - meNow.credits} 枚，先发布几本闲置书吧`);
    }

    const now = Date.now();
    const snap = { title: book.title, cover: book.cover, color: book.color };

    // 扣领书方书币（冻结）
    await transaction.collection('users').doc(me._id)
      .update({ data: { credits: _.inc(-book.credits) } });
    // 锁定书
    await transaction.collection('books').doc(bookId)
      .update({ data: { status: 'exchanging', reservedBy: openid } });

    const base = {
      bookId, bookSnapshot: snap, credits: book.credits,
      status: '待交接', time: now,
      giverOpenid: book.ownerOpenid, takerOpenid: openid
    };
    // 领书方订单
    await transaction.collection('orders').add({
      data: Object.assign({}, base, { _openid: openid, type: 'get',
        counterparty: `${book.ownerName}（${book.ownerAddress}）` })
    });
    // 贡献方订单（提醒对方有人要书、待交接）
    await transaction.collection('orders').add({
      data: Object.assign({}, base, { _openid: book.ownerOpenid, type: 'give',
        counterparty: `${me.name}（${me.address}）` })
    });
    // 领书方流水
    await transaction.collection('transactions').add({
      data: { _openid: openid, title: `兑换《${book.title}》`, delta: -book.credits, time: now }
    });

    return { bookTitle: book.title, credits: book.credits, ownerName: book.ownerName };
  });

  return Object.assign({ ok: true }, result);
};
