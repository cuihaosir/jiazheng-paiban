const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./models/database');

const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const scheduleRoutes = require('./routes/schedule');
const salaryRoutes = require('./routes/salary');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库
initDatabase();

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`[家政排班系统] 后端 API 已启动: http://localhost:${PORT}`);
  console.log(`[家政排班系统] API 文档: http://localhost:${PORT}/api/health`);
});
