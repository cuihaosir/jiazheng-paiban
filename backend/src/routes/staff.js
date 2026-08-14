const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/** GET /api/staff - 获取阿姨列表 */
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, skill, area, keyword } = req.query;

  let sql = 'SELECT * FROM staff WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(Number(status));
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY created_at DESC';
  let list = db.prepare(sql).all(...params);

  // JSON 字段解析
  list = list.map(s => ({
    ...s,
    skills: JSON.parse(s.skills || '[]'),
    serviceAreas: JSON.parse(s.service_areas || '[]'),
    salaryConfig: JSON.parse(s.salary_config || '{}')
  }));

  // 技能和区域过滤（在应用层做，因为是 JSON 字段）
  if (skill) {
    list = list.filter(s => s.skills.includes(skill));
  }
  if (area) {
    list = list.filter(s => s.serviceAreas.includes(area));
  }

  res.json({ code: 0, data: list });
});

/** GET /api/staff/:id - 获取阿姨详情 */
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!staff) {
    return res.status(404).json({ code: 404, message: '阿姨不存在' });
  }
  staff.skills = JSON.parse(staff.skills || '[]');
  staff.serviceAreas = JSON.parse(staff.service_areas || '[]');
  staff.salaryConfig = JSON.parse(staff.salary_config || '{}');
  res.json({ code: 0, data: staff });
});

/** POST /api/staff - 新增阿姨 */
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, phone, avatar, idCard, skills, serviceAreas, salaryType, salaryConfig, entryDate, remark } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ code: 400, message: '姓名和手机号必填' });
  }

  // 检查手机号重复
  const existing = db.prepare('SELECT id FROM staff WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(400).json({ code: 400, message: '该手机号已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO staff (id, name, phone, password, avatar, id_card, skills, service_areas, salary_type, salary_config, status, entry_date, remark)
    VALUES (?, ?, ?, '123456', ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, name, phone, avatar || '👩', idCard || '', JSON.stringify(skills || []), JSON.stringify(serviceAreas || []), salaryType || 1, JSON.stringify(salaryConfig || {}), entryDate || '', remark || '');

  res.json({ code: 0, data: { id }, message: '添加成功' });
});

/** PUT /api/staff/:id - 更新阿姨信息 */
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, phone, avatar, skills, serviceAreas, salaryType, salaryConfig, status, remark } = req.body;

  const staff = db.prepare('SELECT id FROM staff WHERE id = ?').get(req.params.id);
  if (!staff) {
    return res.status(404).json({ code: 404, message: '阿姨不存在' });
  }

  db.prepare(`
    UPDATE staff SET name=?, phone=?, avatar=?, skills=?, service_areas=?, salary_type=?, salary_config=?, status=?, remark=?, updated_at=datetime('now')
    WHERE id = ?
  `).run(name, phone, avatar, JSON.stringify(skills || []), JSON.stringify(serviceAreas || []), salaryType, JSON.stringify(salaryConfig || {}), status, remark, req.params.id);

  res.json({ code: 0, message: '更新成功' });
});

/** DELETE /api/staff/:id - 删除阿姨 */
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '删除成功' });
});

/** GET /api/staff/available/query - 查询空闲阿姨 */
router.get('/available/query', authMiddleware, (req, res) => {
  const db = getDb();
  const { startTime, endTime, serviceType, area } = req.query;

  if (!startTime || !endTime) {
    return res.status(400).json({ code: 400, message: '请提供时间段' });
  }

  // 获取所有在岗阿姨
  let staffList = db.prepare('SELECT * FROM staff WHERE status = 1').all();
  staffList = staffList.map(s => ({
    ...s,
    skills: JSON.parse(s.skills || '[]'),
    serviceAreas: JSON.parse(s.service_areas || '[]'),
    salaryConfig: JSON.parse(s.salary_config || '{}')
  }));

  // 查找有冲突的阿姨ID
  const conflictStaff = db.prepare(`
    SELECT DISTINCT staff_id FROM orders
    WHERE status != 0 AND start_time < ? AND end_time > ?
  `).all(endTime, startTime).map(r => r.staff_id);

  // 过滤
  let available = staffList.filter(s => !conflictStaff.includes(s.id));
  if (serviceType) available = available.filter(s => s.skills.includes(serviceType));
  if (area) available = available.filter(s => s.serviceAreas.some(a => area.includes(a)));

  // 计算匹配度
  available = available.map(s => {
    let score = 60;
    if (serviceType && s.skills.includes(serviceType)) score += 20;
    if (s.rating >= 4.8) score += 10;
    if (area && s.serviceAreas.some(a => area.includes(a))) score += 10;
    return { ...s, matchScore: Math.min(score, 99) };
  }).sort((a, b) => b.matchScore - a.matchScore);

  res.json({ code: 0, data: available });
});

module.exports = router;
