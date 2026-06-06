// 书币定价规则 + 选项常量（云函数侧）
const CATEGORIES = ['绘本启蒙', '桥梁书', '科普百科', '文学读物', '教辅工具'];
const CONDITIONS = ['全新', '九成新', '七成新', '五成新'];
const AGE_RANGES = ['0-3岁', '3-6岁', '6-9岁', '9-12岁', '12岁+'];

// 基础分 + 品相加成 + 品类加成，最低 5
function creditFor(condition, category) {
  let base = 8;
  const bonus = { 全新: 4, 九成新: 2, 七成新: 0, 五成新: -2 };
  base += bonus[condition] != null ? bonus[condition] : 0;
  if (category === '科普百科' || category === '教辅工具') base += 2;
  return Math.max(5, base);
}

module.exports = { CATEGORIES, CONDITIONS, AGE_RANGES, creditFor };
