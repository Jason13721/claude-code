const api = require('../../utils/api.js');

const COVERS = [
  { emoji: '📕', color: '#EF7E72' },
  { emoji: '📗', color: '#7FBF7A' },
  { emoji: '📘', color: '#6BA8E0' },
  { emoji: '📙', color: '#F0A848' },
  { emoji: '🐰', color: '#FFB74D' },
  { emoji: '🚀', color: '#9575CD' },
  { emoji: '🦕', color: '#4DB6AC' },
  { emoji: '🌍', color: '#90CAF9' }
];

// 与云端 lib/credit.js 一致的预估（仅用于即时显示，最终以云端为准）
function estimate(condition, category) {
  let base = 8;
  const bonus = { 全新: 4, 九成新: 2, 七成新: 0, 五成新: -2 };
  base += bonus[condition] != null ? bonus[condition] : 0;
  if (category === '科普百科' || category === '教辅工具') base += 2;
  return Math.max(5, base);
}

Page({
  data: {
    covers: COVERS,
    coverIndex: 0,
    title: '',
    author: '',
    categories: api.CATEGORIES,
    categoryIndex: 0,
    ages: api.AGE_RANGES,
    ageIndex: 1,
    conditions: api.CONDITIONS,
    conditionIndex: 1,
    desc: '',
    estimate: 0,
    submitting: false
  },

  onLoad() {
    this.updateEstimate();
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  onPick(e) {
    this.setData({ [e.currentTarget.dataset.field]: Number(e.detail.value) }, () => this.updateEstimate());
  },

  onPickCover(e) {
    this.setData({ coverIndex: Number(e.currentTarget.dataset.i) });
  },

  updateEstimate() {
    this.setData({
      estimate: estimate(this.data.conditions[this.data.conditionIndex], this.data.categories[this.data.categoryIndex])
    });
  },

  async onSubmit() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写书名', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: '上架中', mask: true });
    const cover = this.data.covers[this.data.coverIndex];
    try {
      const r = await api.publishBook({
        title: this.data.title.trim(),
        author: this.data.author.trim(),
        category: this.data.categories[this.data.categoryIndex],
        ageRange: this.data.ages[this.data.ageIndex],
        condition: this.data.conditions[this.data.conditionIndex],
        desc: this.data.desc.trim(),
        cover: cover.emoji,
        color: cover.color
      });
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showModal({
        title: '上架成功 🎉',
        content: `《${r.book.title}》已上架。被邻居兑换、完成交接后，你会收到 ${r.credits} 书币。`,
        confirmText: '去书架看看',
        cancelText: '再发一本',
        success: (m) => {
          if (m.confirm) wx.switchTab({ url: '/pages/index/index' });
          else this.setData({ title: '', author: '', desc: '' });
        }
      });
    } catch (e) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: e.message || '上架失败', icon: 'none' });
    }
  }
});
