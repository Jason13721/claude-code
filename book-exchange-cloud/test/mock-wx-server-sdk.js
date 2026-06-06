// 微信云开发 SDK 的最小可用模拟实现，仅覆盖本项目云函数用到的能力：
//   database()/collection/where().get()/doc().get()/update()/add()
//   command.inc()、runTransaction()（含失败回滚）、getWXContext()
// 用它就能在本地把“真实的云函数代码”跑起来做验证，无需部署到微信云。

let store = { users: {}, books: {}, orders: {}, transactions: {} };
let seq = 0;
let currentOpenid = 'anonymous';

function nextId() { seq += 1; return 'id_' + seq; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function matches(doc, query) {
  return Object.keys(query).every((k) => doc[k] === query[k]);
}
function applyUpdate(target, data) {
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v && typeof v === 'object' && v.__op === 'inc') {
      target[k] = (target[k] || 0) + v.value;
    } else {
      target[k] = v;
    }
  }
}

// 针对某个数据源（正式库或事务快照）构造 collection 接口
function makeCollection(src) {
  return (name) => {
    if (!src[name]) src[name] = {};
    const col = src[name];
    return {
      where(query) {
        return {
          async get() {
            return { data: Object.values(col).filter((d) => matches(d, query)).map(clone) };
          }
        };
      },
      doc(id) {
        return {
          async get() { return { data: col[id] ? clone(col[id]) : null }; },
          async update({ data }) {
            if (!col[id]) throw new Error('doc not found: ' + id);
            applyUpdate(col[id], data);
            return { stats: { updated: 1 } };
          }
        };
      },
      async add({ data }) {
        const _id = data._id || nextId();
        col[_id] = Object.assign({ _id }, data);
        return { _id };
      }
    };
  };
}

const command = {
  inc: (n) => ({ __op: 'inc', value: n })
};

function database() {
  return {
    command,
    collection: makeCollection(store),
    async runTransaction(fn) {
      const snapshot = clone(store);            // 备份用于回滚
      const txStore = store;                    // 事务直接作用于主存（单线程测试足够）
      const transaction = { collection: makeCollection(txStore) };
      try {
        const result = await fn(transaction);
        return result;
      } catch (e) {
        store = snapshot;                        // 回滚
        throw e;
      }
    }
  };
}

module.exports = {
  init() {},
  DYNAMIC_CURRENT_ENV: 'DYNAMIC_CURRENT_ENV',
  database,
  getWXContext() { return { OPENID: currentOpenid }; },

  // —— 测试辅助 ——
  __setOpenid(id) { currentOpenid = id; },
  __reset() { store = { users: {}, books: {}, orders: {}, transactions: {} }; seq = 0; currentOpenid = 'anonymous'; },
  __dump() { return clone(store); }
};
