/**
 * 邻里换书 —— 内存数据仓库 + 书币（积分）规则
 *
 * 设计要点：
 *  - 用「书币」解耦“给”与“取”，避免一对一交换的双重需求巧合难题。
 *      · 把书贡献出去（上架）→ 获得书币
 *      · 想要别人的书 → 用书币兑换
 *  - 范围先锁定在「单个小区」，书架只展示同小区的书，线下楼下交接。
 *
 * 注意：这是原型，状态保存在模块内存里，重启小程序会重置为下面的演示数据。
 *      正式版本应替换为云开发 / 后端接口。
 */

// 书籍分类（也用于发布时选择）
const CATEGORIES = ['绘本启蒙', '桥梁书', '科普百科', '文学读物', '教辅工具'];
// 品相选项，影响书币定价
const CONDITIONS = ['全新', '九成新', '七成新', '五成新'];
// 适读年龄段
const AGE_RANGES = ['0-3岁', '3-6岁', '6-9岁', '9-12岁', '12岁+'];

let _seq = 100; // 自增 id
function nextId(prefix) {
  _seq += 1;
  return prefix + _seq;
}

// 书币定价：基础分 + 品相加成 + 品类加成，最低 5
function creditFor(condition, category) {
  let base = 8;
  const conditionBonus = { 全新: 4, 九成新: 2, 七成新: 0, 五成新: -2 };
  base += conditionBonus[condition] != null ? conditionBonus[condition] : 0;
  if (category === '科普百科' || category === '教辅工具') base += 2;
  return Math.max(5, base);
}

// ——— 演示数据 ———
const state = {
  community: '阳光花园小区',
  user: {
    name: '王爸爸',
    address: '4栋1单元',
    avatar: '🙂',
    credits: 30 // 新人礼包，方便立刻体验兑换
  },
  books: [
    {
      id: 'b1', title: '猜猜我有多爱你', author: '山姆·麦克布雷尼', cover: '🐰',
      color: '#FFB74D', category: '绘本启蒙', ageRange: '0-3岁', condition: '九成新',
      credits: 10, desc: '经典睡前绘本，孩子很喜欢，仅有少量翻阅痕迹。',
      owner: { name: '李妈妈', address: '3栋2单元' }, mine: false, status: 'available'
    },
    {
      id: 'b2', title: '神奇校车·人体内的旅行', author: '乔安娜·柯尔', cover: '🚌',
      color: '#4FC3F7', category: '科普百科', ageRange: '6-9岁', condition: '七成新',
      credits: 10, desc: '科普经典，封面有点旧但内页完整，适合开始读科普的孩子。',
      owner: { name: '张阿姨', address: '1栋3单元' }, mine: false, status: 'available'
    },
    {
      id: 'b3', title: '小猪佩奇双语故事（10册）', author: 'EONE', cover: '🐷',
      color: '#F48FB1', category: '桥梁书', ageRange: '3-6岁', condition: '全新',
      credits: 12, desc: '整套几乎没翻过，孩子不太感兴趣，转给需要的邻居。',
      owner: { name: '陈老师', address: '6栋1单元' }, mine: false, status: 'available'
    },
    {
      id: 'b4', title: '夏洛的网', author: 'E·B·怀特', cover: '🕸️',
      color: '#A5D6A7', category: '文学读物', ageRange: '9-12岁', condition: '九成新',
      credits: 10, desc: '读完一遍，保存很好，希望换一本科普类的书。',
      owner: { name: '刘爸爸', address: '2栋2单元' }, mine: false, status: 'available'
    },
    {
      id: 'b5', title: '我爸爸 / 我妈妈（套装）', author: '安东尼·布朗', cover: '👨‍👩‍👧',
      color: '#FFD54F', category: '绘本启蒙', ageRange: '3-6岁', condition: '七成新',
      credits: 8, desc: '低幼经典绘本，有点磨损不影响阅读。',
      owner: { name: '赵妈妈', address: '5栋1单元' }, mine: false, status: 'available'
    },
    {
      id: 'b6', title: '写给儿童的中国历史', author: '陈卫平', cover: '📜',
      color: '#BCAAA4', category: '科普百科', ageRange: '9-12岁', condition: '九成新',
      credits: 12, desc: '套装中的两册，孩子读过一遍，品相不错。',
      owner: { name: '孙阿姨', address: '7栋2单元' }, mine: false, status: 'available'
    },
    {
      id: 'b7', title: '海底小纵队·探险记', author: 'Vampire Squid', cover: '🐙',
      color: '#80DEEA', category: '桥梁书', ageRange: '3-6岁', condition: '五成新',
      credits: 6, desc: '孩子翻得比较旧了，喜欢海底小纵队的可以拿走。',
      owner: { name: '周妈妈', address: '8栋1单元' }, mine: false, status: 'available'
    },
    {
      id: 'b8', title: 'DK儿童百科全书', author: 'DK', cover: '🌍',
      color: '#90CAF9', category: '科普百科', ageRange: '6-9岁', condition: '全新',
      credits: 14, desc: '大部头，几乎全新，希望换给爱探索的小朋友。',
      owner: { name: '吴爸爸', address: '3栋1单元' }, mine: false, status: 'available'
    }
  ],
  orders: [], // 交易：{ id, type:'get'|'give', book, credits, status:'待交接'|'已完成', time, counterparty }
  transactions: [
    { id: 't1', title: '新人礼包', delta: 30, time: '注册时' }
  ]
};

function now() {
  const d = new Date();
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function addTransaction(title, delta) {
  state.transactions.unshift({ id: nextId('t'), title, delta, time: now() });
}

// ——— 对外 API ———
const store = {
  CATEGORIES,
  CONDITIONS,
  AGE_RANGES,
  creditFor,

  getCommunity() { return state.community; },
  getUser() { return state.user; },

  // 书架：默认只展示可兑换的、且非本人发布的书；可按分类筛选
  listBooks(category) {
    return state.books.filter((b) => {
      if (b.status !== 'available') return false;
      if (b.mine) return false;
      if (category && category !== '全部' && b.category !== category) return false;
      return true;
    });
  },

  getBook(id) { return state.books.find((b) => b.id === id); },

  // 我发布的书
  myBooks() { return state.books.filter((b) => b.mine); },

  // 发布闲置书 → 立刻获得书币（原型简化；正式版可在交接完成时结算）
  publishBook(form) {
    const credits = creditFor(form.condition, form.category);
    const book = {
      id: nextId('b'),
      title: form.title,
      author: form.author || '佚名',
      cover: form.cover || '📚',
      color: form.color || '#FF8A3D',
      category: form.category,
      ageRange: form.ageRange,
      condition: form.condition,
      credits,
      desc: form.desc || '',
      owner: { name: state.user.name, address: state.user.address },
      mine: true,
      status: 'available'
    };
    state.books.unshift(book);
    state.user.credits += credits;
    addTransaction(`上架《${book.title}》`, credits);
    state.orders.unshift({
      id: nextId('o'), type: 'give', book, credits,
      status: '已上架', time: now(), counterparty: '待邻居兑换'
    });
    return { book, credits };
  },

  // 兑换他人的书 → 扣书币，生成待交接订单
  exchangeBook(id) {
    const book = this.getBook(id);
    if (!book) return { ok: false, msg: '书籍不存在' };
    if (book.status !== 'available') return { ok: false, msg: '这本书已被兑换' };
    if (book.mine) return { ok: false, msg: '这是你自己发布的书' };
    if (state.user.credits < book.credits) {
      return { ok: false, msg: `书币不足，还差 ${book.credits - state.user.credits} 枚，先发布几本闲置书吧` };
    }
    state.user.credits -= book.credits;
    book.status = 'exchanging';
    addTransaction(`兑换《${book.title}》`, -book.credits);
    const order = {
      id: nextId('o'), type: 'get', book, credits: book.credits,
      status: '待交接', time: now(), counterparty: `${book.owner.name}（${book.owner.address}）`
    };
    state.orders.unshift(order);
    return { ok: true, order };
  },

  getOrders() { return state.orders; },
  getTransactions() { return state.transactions; },

  // 确认线下交接完成
  confirmOrder(id) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return { ok: false };
    order.status = '已完成';
    if (order.type === 'get') {
      const book = this.getBook(order.book.id);
      if (book) book.status = 'exchanged';
    }
    return { ok: true };
  }
};

module.exports = store;
