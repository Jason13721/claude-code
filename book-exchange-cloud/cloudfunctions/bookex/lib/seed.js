// 演示数据：同小区的“邻居”和他们贡献的书。
// seedBooks 云函数会把这些写进数据库，让书架在冷启动时不为空。
const { creditFor } = require('./credit');

const SEED_NEIGHBORS = [
  { openid: 'seed_li',   name: '李妈妈',  address: '3栋2单元' },
  { openid: 'seed_zhang', name: '张阿姨', address: '1栋3单元' },
  { openid: 'seed_chen', name: '陈老师',  address: '6栋1单元' },
  { openid: 'seed_liu',  name: '刘爸爸',  address: '2栋2单元' },
  { openid: 'seed_zhao', name: '赵妈妈',  address: '5栋1单元' },
  { openid: 'seed_sun',  name: '孙阿姨',  address: '7栋2单元' },
  { openid: 'seed_wu',   name: '吴爸爸',  address: '3栋1单元' }
];

const RAW_BOOKS = [
  { ownerOpenid: 'seed_li',   title: '猜猜我有多爱你', author: '山姆·麦克布雷尼', cover: '🐰', color: '#FFB74D', category: '绘本启蒙', ageRange: '0-3岁', condition: '九成新', desc: '经典睡前绘本，孩子很喜欢，仅有少量翻阅痕迹。' },
  { ownerOpenid: 'seed_zhang', title: '神奇校车·人体内的旅行', author: '乔安娜·柯尔', cover: '🚌', color: '#4FC3F7', category: '科普百科', ageRange: '6-9岁', condition: '七成新', desc: '科普经典，封面有点旧但内页完整。' },
  { ownerOpenid: 'seed_chen', title: '小猪佩奇双语故事（10册）', author: 'EONE', cover: '🐷', color: '#F48FB1', category: '桥梁书', ageRange: '3-6岁', condition: '全新', desc: '整套几乎没翻过，转给需要的邻居。' },
  { ownerOpenid: 'seed_liu',  title: '夏洛的网', author: 'E·B·怀特', cover: '🕸️', color: '#A5D6A7', category: '文学读物', ageRange: '9-12岁', condition: '九成新', desc: '读完一遍，保存很好。' },
  { ownerOpenid: 'seed_zhao', title: '我爸爸 / 我妈妈（套装）', author: '安东尼·布朗', cover: '👨‍👩‍👧', color: '#FFD54F', category: '绘本启蒙', ageRange: '3-6岁', condition: '七成新', desc: '低幼经典绘本，有点磨损不影响阅读。' },
  { ownerOpenid: 'seed_sun',  title: '写给儿童的中国历史', author: '陈卫平', cover: '📜', color: '#BCAAA4', category: '科普百科', ageRange: '9-12岁', condition: '九成新', desc: '套装中的两册，品相不错。' },
  { ownerOpenid: 'seed_wu',   title: 'DK儿童百科全书', author: 'DK', cover: '🌍', color: '#90CAF9', category: '科普百科', ageRange: '6-9岁', condition: '全新', desc: '大部头，几乎全新。' }
];

// 预先算好书币价格
const SEED_BOOKS = RAW_BOOKS.map((b) => Object.assign({}, b, {
  credits: creditFor(b.condition, b.category)
}));

module.exports = { SEED_NEIGHBORS, SEED_BOOKS };
