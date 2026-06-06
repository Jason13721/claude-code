// seedBooks：往某小区写入演示用的“邻居”和书，解决冷启动空书架。可重复调用（幂等）。
const { SEED_NEIGHBORS, SEED_BOOKS } = require('../lib/seed');

module.exports = async function seedBooks(event, { cloud }) {
  const db = cloud.database();
  const community = event.community || '阳光花园小区';

  // 建立邻居账号（用于交接结算）
  for (const n of SEED_NEIGHBORS) {
    const ex = await db.collection('users').where({ _openid: n.openid }).get();
    if (ex.data.length === 0) {
      await db.collection('users').add({
        data: { _openid: n.openid, name: n.name, avatar: '📚', community,
          address: n.address, credits: 0, createdAt: Date.now(), seed: true }
      });
    }
  }

  // 已经播过种就不重复插书
  const existing = await db.collection('books').where({ community, seed: true }).get();
  if (existing.data.length > 0) {
    return { ok: true, inserted: 0, note: '该小区已有演示数据' };
  }

  let n = 0;
  for (const b of SEED_BOOKS) {
    const owner = SEED_NEIGHBORS.find((x) => x.openid === b.ownerOpenid);
    await db.collection('books').add({
      data: Object.assign({}, b, {
        _openid: b.ownerOpenid, community,
        ownerName: owner.name, ownerAddress: owner.address,
        status: 'available', createdAt: Date.now() - n * 1000, seed: true
      })
    });
    n++;
  }
  return { ok: true, inserted: n };
};
