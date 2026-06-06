// publishBook：上架一本闲置书。注意——云开发版“发布不立即得书币”，
// 书币在交接确认时由领书方结算给贡献方（见 confirmOrder），可防止刷书币。
const { creditFor } = require('../lib/credit');

module.exports = async function publishBook(event, { cloud, openid }) {
  const db = cloud.database();
  const f = event.form || {};
  if (!f.title || !f.title.trim()) throw new Error('请填写书名');

  const userR = await db.collection('users').where({ _openid: openid }).get();
  const user = userR.data[0];
  if (!user) throw new Error('请先登录');

  const credits = creditFor(f.condition, f.category);
  const book = {
    _openid: openid,
    ownerOpenid: openid,
    ownerName: user.name,
    ownerAddress: user.address,
    community: user.community,
    title: f.title.trim(),
    author: (f.author || '').trim() || '佚名',
    cover: f.cover || '📚',
    color: f.color || '#FF8A3D',
    category: f.category,
    ageRange: f.ageRange,
    condition: f.condition,
    desc: (f.desc || '').trim(),
    credits,            // 别人兑换它需要的书币
    status: 'available',
    createdAt: Date.now()
  };
  const res = await db.collection('books').add({ data: book });
  return { ok: true, book: Object.assign({ _id: res._id }, book), credits };
};
