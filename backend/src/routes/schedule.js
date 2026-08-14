const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

/** GET /api/schedule/week - 获取周排班视图数据 */
router.get('/week', authMiddleware, (req, res) => {
  const db = getDb();
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ code: 400, message: '请提供 startDate 和 endDate' });
  }

  // 获取所有在岗阿姨
  let staff = db.prepare('SELECT id, name, phone, avatar, status FROM staff WHERE status != 3 ORDER BY name').all();

  // 获取该周所有有效订单
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE status != 0 AND start_time >= ? AND start_time < ?
    ORDER BY start_time
  `).all(startDate, endDate);

  // 按阿姨分组
  const scheduleMap = {};
  staff.forEach(s => { scheduleMap[s.id] = []; });
  orders.forEach(o => {
    if (scheduleMap[o.staff_id]) {
      scheduleMap[o.staff_id].push(o);
    }
  });

  res.json({
    code: 0,
    data: { staff, orders, scheduleMap }
  });
});

/** GET /api/schedule/day - 获取日排班数据 */
router.get('/day', authMiddleware, (req, res) => {
  const db = getDb();
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ code: 400, message: '请提供 date 参数' });
  }

  const startOfDay = date + 'T00:00:00';
  const endOfDay = date + 'T23:59:59';

  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE status != 0 AND start_time >= ? AND start_time <= ?
    ORDER BY start_time
  `).all(startOfDay, endOfDay);

  res.json({ code: 0, data: orders });
});

/** POST /api/schedule/conflict-check - 检查排班冲突 */
router.post('/conflict-check', authMiddleware, (req, res) => {
  const db = getDb();
  const { staffId, startTime, endTime, excludeOrderId } = req.body;

  if (!staffId || !startTime || !endTime) {
    return res.status(400).json({ code: 400, message: '参数不完整' });
  }

  let sql = `
    SELECT * FROM orders
    WHERE staff_id = ? AND status != 0
    AND start_time < ? AND end_time > ?
  `;
  const params = [staffId, endTime, startTime];

  if (excludeOrderId) {
    sql += ' AND id != ?';
    params.push(excludeOrderId);
  }

  const conflicts = db.prepare(sql).all(...params);

  res.json({
    code: 0,
    data: {
      hasConflict: conflicts.length > 0,
      conflicts
    }
  });
});

/** GET /api/schedule/my - 阿姨查看自己的排班 */
router.get('/my', authMiddleware, (req, res) => {
  const db = getDb();
  const { startDate, endDate } = req.query;

  if (req.user.role !== 'staff') {
    return res.status(403).json({ code: 403, message: '仅阿姨可访问' });
  }

  let sql = 'SELECT * FROM orders WHERE staff_id = ? AND status != 0';
  const params = [req.user.id];

  if (startDate) { sql += ' AND start_time >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND start_time <= ?'; params.push(endDate); }

  sql += ' ORDER BY start_time';
  const orders = db.prepare(sql).all(...params);

  res.json({ code: 0, data: orders });
});

module.exports = router;
