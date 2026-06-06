// login：确保当前微信用户在 users 集合里有档案，没有就建档并发新人礼包。
const SIGNUP_BONUS = 30;
const DEFAULT_COMMUNITY = '阳光花园小区';

module.exports = async function login(event, { cloud, openid }) {
  const db = cloud.database();
  const users = db.collection('users');

  const found = await users.where({ _openid: openid }).get();
  if (found.data.length > 0) {
    return { ok: true, user: found.data[0], isNew: false };
  }

  const profile = {
    _openid: openid,
    name: event.name || '热心邻居',
    avatar: event.avatar || '🙂',
    community: event.community || DEFAULT_COMMUNITY,
    address: event.address || '',
    credits: SIGNUP_BONUS,
    createdAt: Date.now()
  };
  const res = await users.add({ data: profile });
  await db.collection('transactions').add({
    data: { _openid: openid, title: '新人礼包', delta: SIGNUP_BONUS, time: Date.now() }
  });
  return { ok: true, user: Object.assign({ _id: res._id }, profile), isNew: true };
};
