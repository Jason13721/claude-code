// getShelf：列出某小区内、可兑换、且不是自己发布的书。范围按 community 隔离。
module.exports = async function getShelf(event, { cloud, openid }) {
  const db = cloud.database();
  const community = event.community;
  const category = event.category;

  const res = await db.collection('books')
    .where({ community, status: 'available' })
    .get();

  let books = res.data.filter((b) => b.ownerOpenid !== openid);
  if (category && category !== '全部') {
    books = books.filter((b) => b.category === category);
  }
  books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // 顺带返回当前用户书币余额，省去书架页再单独查一次
  const meR = await db.collection('users').where({ _openid: openid }).get();
  const credits = meR.data[0] ? meR.data[0].credits : 0;

  return { ok: true, books, credits };
};
