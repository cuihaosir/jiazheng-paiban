const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/** GET /api/salary - 获取工资列表 */
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { month, staffId } = req.query;

  let sql = 'SELECT * FROM salary_records WHERE 1=1';
  const params = [];

  if (req.user.role === 'staff') {
    sql += ' AND staff_id = ?';
    params.push(req.user.id);
  } else if (staffId) {
    sql += ' AND staff_id = ?';
    params.push(staffId);
  }

  if (month) {
    sql += ' AND month = ?';
    params.push(month);
  }

  sql += ' ORDER BY should_pay DESC';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

/** POST /api/salary/calculate - 计算指定月份工资 */
router.post('/calculate', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { month } = req.body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ code: 400, message: '请提供正确的月份格式 (YYYY-MM)' });
  }

  const [year, mon] = month.split('-').map(Number);
  const startOfMonth = `${month}-01T00:00:00`;
  const endOfMonth = new Date(year, mon, 1).toISOString().slice(0, 19);

  // 获取所有非离职阿姨
  const staffList = db.prepare('SELECT * FROM staff WHERE status != 3').all();

  // 先删除本月已有记录
  db.prepare('DELETE FROM salary_records WHERE month = ?').run(month);

  const insertSalary = db.prepare(`
    INSERT INTO salary_records (id, staff_id, staff_name, month, order_count, total_hours, base_salary, commission, bonus, subsidy, deduction, should_pay, actual_pay, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const results = [];

  for (const staff of staffList) {
    const salaryConfig = JSON.parse(staff.salary_config || '{}');
    const completedOrders = db.prepare(`
      SELECT * FROM orders
      WHERE staff_id = ? AND status = 4
      AND start_time >= ? AND start_time < ?
    `).all(staff.id, startOfMonth, endOfMonth);

    const orderCount = completedOrders.length;
    const totalHours = completedOrders.reduce((sum, o) => sum + (o.duration || 0), 0);
    let baseSalary = 0, commission = 0;

    switch (staff.salary_type) {
      case 1: // 按单结算
        baseSalary = completedOrders.reduce((sum, o) => {
          const perOrder = salaryConfig.perOrder || {};
          return sum + (perOrder[o.service_type] || 80);
        }, 0);
        break;
      case 2: // 按小时
        baseSalary = totalHours * (salaryConfig.hourlyRate || 40);
        break;
      case 3: // 底薪+提成
        baseSalary = salaryConfig.baseSalary || 3000;
        commission = completedOrders.reduce((sum, o) => sum + o.amount * (salaryConfig.commissionRate || 0.15), 0);
        break;
      case 4: // 包月
        baseSalary = salaryConfig.monthlyPay || 5000;
        break;
    }

    const bonus = orderCount >= 20 ? 200 : 0;
    const subsidy = totalHours >= 80 ? 100 : 0;
    const deduction = 0;
    const shouldPay = Math.round((baseSalary + commission + bonus + subsidy - deduction) * 100) / 100;

    const record = {
      id: uuidv4(),
      staffId: staff.id,
      staffName: staff.name,
      month,
      orderCount,
      totalHours,
      baseSalary: Math.round(baseSalary * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      bonus, subsidy, deduction,
      shouldPay,
      actualPay: shouldPay
    };

    insertSalary.run(record.id, record.staffId, record.staffName, month, orderCount, totalHours, record.baseSalary, record.commission, bonus, subsidy, deduction, shouldPay, shouldPay);
    results.push(record);
  }

  res.json({ code: 0, data: results, message: `${results.length}人工资计算完成` });
});

/** PUT /api/salary/:id/confirm - 确认工资 */
router.put('/:id/confirm', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE salary_records SET status = 2 WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '已确认' });
});

/** PUT /api/salary/confirm-all - 批量确认 */
router.put('/confirm-all/:month', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE salary_records SET status = 2 WHERE month = ?').run(req.params.month);
  res.json({ code: 0, message: '全部确认' });
});

module.exports = router;
