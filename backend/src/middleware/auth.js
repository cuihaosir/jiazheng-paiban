const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'housekeeping_secret_key_2026';

/** 生成 Token */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/** 验证 Token 中间件 */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token 过期或无效，请重新登录' });
  }
}

/** 验证管理员角色 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role === 'staff') {
    return res.status(403).json({ code: 403, message: '无权限访问' });
  }
  next();
}

module.exports = { generateToken, authMiddleware, adminOnly, JWT_SECRET };
