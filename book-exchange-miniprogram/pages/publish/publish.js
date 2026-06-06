const store = require('../../utils/store.js');

// 可选的封面表情 + 配色（原型用，免去上传图片）
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

Page({
  data: {
    covers: COVERS,
    coverIndex: 0,
    title: '',
    author: '',
    categories: store.CATEGORIES,
    categoryIndex: 0,
    ages: store.AGE_RANGES,
    ageIndex: 1,
    conditions: store.CONDITIONS,
    conditionIndex: 1,
    desc: '',
    estimate: 0
  },

  onLoad() {
    this.updateEstimate();
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  onPick(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: Number(e.detail.value) }, () => this.updateEstimate());
  },

  onPickCover(e) {
    this.setData({ coverIndex: Number(e.currentTarget.dataset.i) });
  },

  updateEstimate() {
    const condition = this.data.conditions[this.data.conditionIndex];
    const category = this.data.categories[this.data.categoryIndex];
    this.setData({ estimate: store.creditFor(condition, category) });
  },

  onSubmit() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写书名', icon: 'none' });
      return;
    }
    const cover = this.data.covers[this.data.coverIndex];
    const res = store.publishBook({
      title: this.data.title.trim(),
      author: this.data.author.trim(),
      category: this.data.categories[this.data.categoryIndex],
      ageRange: this.data.ages[this.data.ageIndex],
      condition: this.data.conditions[this.data.conditionIndex],
      desc: this.data.desc.trim(),
      cover: cover.emoji,
      color: cover.color
    });
    wx.showModal({
      title: '上架成功 🎉',
      content: `《${res.book.title}》已上架，到账 ${res.credits} 书币！用它去兑换你想读的书吧。`,
      confirmText: '去书架看看',
      cancelText: '再发一本',
      success: (m) => {
        if (m.confirm) {
          wx.switchTab({ url: '/pages/index/index' });
        } else {
          this.setData({ title: '', author: '', desc: '' });
        }
      }
    });
  }
});
