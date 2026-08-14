const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

/** POST /api/auth/admin-login - 管理端登录 */
router.post('/admin-login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ code: 400, message: '请输入手机号和密码' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE phone = ?').get(phone);
  if (!user || user.password !== password) {
    return res.status(401).json({ code: 401, message: '手机号或密码错误' });
  }

  const token = generateToken({ id: user.id, name: user.name, phone: user.phone, role: user.role });
  res.json({
    code: 0,
    data: {
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
    }
  });
});

/** POST /api/auth/staff-login - 阿姨端登录 */
router.post('/staff-login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ code: 400, message: '请输入手机号和密码' });
  }

  const db = getDb();
  const staff = db.prepare('SELECT * FROM staff WHERE phone = ?').get(phone);
  if (!staff || staff.password !== password) {
    return res.status(401).json({ code: 401, message: '手机号或密码错误' });
  }

  const token = generateToken({ id: staff.id, name: staff.name, phone: staff.phone, role: 'staff', avatar: staff.avatar });
  res.json({
    code: 0,
    data: {
      token,
      user: { id: staff.id, name: staff.name, phone: staff.phone, role: 'staff', avatar: staff.avatar }
    }
  });
});

/** GET /api/auth/me - 获取当前用户信息 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ code: 0, data: req.user });
});

module.exports = router;
