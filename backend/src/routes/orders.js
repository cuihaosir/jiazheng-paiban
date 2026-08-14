const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/** 生成订单号 */
function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return 'JZ' + date + seq;
}

/** GET /api/orders - 订单列表 */
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, staffId, customerId, startDate, endDate, page = 1, pageSize = 50 } = req.query;

  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  // 阿姨端只能看自己的订单
  if (req.user.role === 'staff') {
    sql += ' AND staff_id = ?';
    params.push(req.user.id);
  } else {
    if (staffId) { sql += ' AND staff_id = ?'; params.push(staffId); }
    if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  }

  if (status !== undefined && status !== '') {
    sql += ' AND status = ?';
    params.push(Number(status));
  }
  if (startDate) { sql += ' AND start_time >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND start_time <= ?'; params.push(endDate); }

  sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

/** GET /api/orders/:id - 订单详情 */
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  res.json({ code: 0, data: order });
});

/** POST /api/orders - 创建订单 */
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const {
    customerId, customerName, customerPhone,
    staffId, staffName,
    serviceType, startTime, endTime, duration,
    address, amount, source, remark
  } = req.body;

  if (!customerId || !staffId || !serviceType || !startTime || !endTime) {
    return res.status(400).json({ code: 400, message: '缺少必填字段' });
  }

  // 排班冲突检测
  const conflicts = db.prepare(`
    SELECT * FROM orders
    WHERE staff_id = ? AND status != 0
    AND start_time < ? AND end_time > ?
  `).all(staffId, endTime, startTime);

  if (conflicts.length > 0) {
    return res.status(409).json({
      code: 409,
      message: '排班冲突',
      data: conflicts.map(c => ({
        id: c.id,
        startTime: c.start_time,
        endTime: c.end_time,
        customerName: c.customer_name
      }))
    });
  }

  const id = uuidv4();
  const orderNo = generateOrderNo();

  db.prepare(`
    INSERT INTO orders (id, order_no, customer_id, customer_name, customer_phone, staff_id, staff_name, service_type, start_time, end_time, duration, address, amount, status, source, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, orderNo, customerId, customerName, customerPhone, staffId, staffName, serviceType, startTime, endTime, duration, address, amount, source, remark);

  // 更新客户消费统计
  db.prepare(`
    UPDATE customers SET total_orders = total_orders + 1, total_amount = total_amount + ?, last_service_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(amount, startTime.slice(0, 10), customerId);

  res.json({ code: 0, data: { id, orderNo }, message: '订单创建成功' });
});

/** PUT /api/orders/:id/status - 更新订单状态 */
router.put('/:id/status', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, cancelReason } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  // 阿姨只能操作自己的订单
  if (req.user.role === 'staff' && order.staff_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权操作此订单' });
  }

  let sql = 'UPDATE orders SET status = ?, updated_at = datetime(\'now\')';
  const params = [status];

  if (status === 0 && cancelReason) {
    sql += ', cancel_reason = ?';
    params.push(cancelReason);
  }

  sql += ' WHERE id = ?';
  params.push(req.params.id);
  db.prepare(sql).run(...params);

  res.json({ code: 0, message: '状态更新成功' });
});

/** PUT /api/orders/:id/reschedule - 订单改期 */
router.put('/:id/reschedule', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { startTime, endTime } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  // 检测新时间冲突
  const conflicts = db.prepare(`
    SELECT * FROM orders
    WHERE staff_id = ? AND status != 0 AND id != ?
    AND start_time < ? AND end_time > ?
  `).all(order.staff_id, req.params.id, endTime, startTime);

  if (conflicts.length > 0) {
    return res.status(409).json({ code: 409, message: '新时间段有排班冲突' });
  }

  db.prepare('UPDATE orders SET start_time = ?, end_time = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(startTime, endTime, req.params.id);

  res.json({ code: 0, message: '改期成功' });
});

module.exports = router;
