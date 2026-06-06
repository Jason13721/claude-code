// getBook：按 id 取单本书详情
module.exports = async function getBook(event, { cloud }) {
  const db = cloud.database();
  const res = await db.collection('books').doc(event.bookId).get();
  return { ok: true, book: res.data };
};
