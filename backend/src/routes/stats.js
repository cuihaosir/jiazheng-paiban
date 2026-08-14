const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/** GET /api/stats/overview - 经营数据概览 */
router.get('/overview', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
  const todayStart = now.toISOString().slice(0, 10) + 'T00:00:00';
  const todayEnd = now.toISOString().slice(0, 10) + 'T23:59:59';

  // 今日订单
  const todayOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE start_time >= ? AND start_time <= ?').get(todayStart, todayEnd);

  // 本月数据
  const monthOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE start_time >= ?').get(monthStart);
  const monthCompleted = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE start_time >= ? AND status = 4').get(monthStart);
  const monthRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE start_time >= ? AND status = 4').get(monthStart);
  const monthCancelled = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE start_time >= ? AND status = 0').get(monthStart);

  // 活跃阿姨
  const activeStaff = db.prepare('SELECT COUNT(*) as cnt FROM staff WHERE status = 1').get();

  // 总客户
  const totalCustomers = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();

  // 新增客户
  const newCustomers = db.prepare("SELECT COUNT(*) as cnt FROM customers WHERE created_at >= ?").get(monthStart);

  // 取消率
  const cancelRate = monthOrders.cnt > 0 ? Math.round(monthCancelled.cnt / monthOrders.cnt * 100) : 0;

  // 平均客单价
  const avgOrderAmount = monthCompleted.cnt > 0 ? Math.round(monthRevenue.total / monthCompleted.cnt) : 0;

  res.json({
    code: 0,
    data: {
      todayOrders: todayOrders.cnt,
      monthOrders: monthOrders.cnt,
      monthCompleted: monthCompleted.cnt,
      monthRevenue: monthRevenue.total,
      activeStaff: activeStaff.cnt,
      totalCustomers: totalCustomers.cnt,
      newCustomers: newCustomers.cnt,
      cancelRate,
      avgOrderAmount
    }
  });
});

/** GET /api/stats/service-types - 服务类型统计 */
router.get('/service-types', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const list = db.prepare(`
    SELECT service_type as type, COUNT(*) as count, SUM(amount) as revenue
    FROM orders WHERE status = 4
    GROUP BY service_type ORDER BY count DESC
  `).all();
  res.json({ code: 0, data: list });
});

/** GET /api/stats/staff-performance - 阿姨绩效排行 */
router.get('/staff-performance', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { month } = req.query;

  let dateFilter = '';
  const params = [];
  if (month) {
    const [y, m] = month.split('-').map(Number);
    dateFilter = 'AND o.start_time >= ? AND o.start_time < ?';
    params.push(`${month}-01T00:00:00`, new Date(y, m, 1).toISOString().slice(0, 19));
  }

  const list = db.prepare(`
    SELECT s.id, s.name, s.avatar, s.rating,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.amount), 0) as revenue,
      COALESCE(SUM(o.duration), 0) as total_hours
    FROM staff s
    LEFT JOIN orders o ON s.id = o.staff_id AND o.status = 4 ${dateFilter}
    WHERE s.status != 3
    GROUP BY s.id
    ORDER BY order_count DESC
  `).all(...params);

  res.json({ code: 0, data: list });
});

/** GET /api/stats/order-sources - 订单来源统计 */
router.get('/order-sources', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const list = db.prepare(`
    SELECT source, COUNT(*) as count
    FROM orders WHERE source IS NOT NULL AND source != ''
    GROUP BY source ORDER BY count DESC
  `).all();
  res.json({ code: 0, data: list });
});

/** GET /api/stats/daily-orders - 每日订单趋势（最近30天） */
router.get('/daily-orders', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const list = db.prepare(`
    SELECT DATE(start_time) as date, COUNT(*) as count, SUM(CASE WHEN status=4 THEN amount ELSE 0 END) as revenue
    FROM orders
    WHERE start_time >= datetime('now', '-30 days')
    GROUP BY DATE(start_time)
    ORDER BY date
  `).all();
  res.json({ code: 0, data: list });
});

module.exports = router;
