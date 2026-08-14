const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/** GET /api/customers - 客户列表 */
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { keyword, level, needRepurchase } = req.query;

  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (keyword) {
    sql += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (level) {
    sql += ' AND level >= ?';
    params.push(Number(level));
  }

  sql += ' ORDER BY total_amount DESC';
  let list = db.prepare(sql).all(...params);

  list = list.map(c => ({
    ...c,
    tags: JSON.parse(c.tags || '[]')
  }));

  // 复购提醒过滤
  if (needRepurchase === 'true') {
    const now = new Date();
    list = list.filter(c => {
      if (!c.last_service_date) return false;
      const diff = Math.floor((now - new Date(c.last_service_date)) / (1000 * 60 * 60 * 24));
      return diff > 30;
    });
  }

  res.json({ code: 0, data: list });
});

/** GET /api/customers/:id - 客户详情 */
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ code: 404, message: '客户不存在' });
  }
  customer.tags = JSON.parse(customer.tags || '[]');
  res.json({ code: 0, data: customer });
});

/** POST /api/customers - 新增客户 */
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, phone, address, source, level, tags, remark } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ code: 400, message: '姓名和手机号必填' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO customers (id, name, phone, address, source, level, tags, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, phone, address || '', source || '', level || 1, JSON.stringify(tags || []), remark || '');

  res.json({ code: 0, data: { id }, message: '添加成功' });
});

/** PUT /api/customers/:id - 更新客户 */
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, phone, address, source, level, tags, remark } = req.body;

  db.prepare(`
    UPDATE customers SET name=?, phone=?, address=?, source=?, level=?, tags=?, remark=?, updated_at=datetime('now')
    WHERE id = ?
  `).run(name, phone, address, source, level, JSON.stringify(tags || []), remark, req.params.id);

  res.json({ code: 0, message: '更新成功' });
});

/** DELETE /api/customers/:id - 删除客户 */
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '删除成功' });
});

module.exports = router;
