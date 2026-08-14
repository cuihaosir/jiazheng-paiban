const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../database/housekeeping.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // 管理员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'dispatcher',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 阿姨表
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT '123456',
      avatar TEXT DEFAULT '👩',
      id_card TEXT,
      skills TEXT DEFAULT '[]',
      service_areas TEXT DEFAULT '[]',
      salary_type INTEGER DEFAULT 1,
      salary_config TEXT DEFAULT '{}',
      status INTEGER DEFAULT 1,
      entry_date TEXT,
      rating REAL DEFAULT 5.0,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 客户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      source TEXT,
      level INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      balance REAL DEFAULT 0,
      last_service_date TEXT,
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      staff_id TEXT NOT NULL,
      staff_name TEXT,
      service_type TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration REAL,
      address TEXT,
      amount REAL DEFAULT 0,
      status INTEGER DEFAULT 1,
      source TEXT,
      remark TEXT,
      cancel_reason TEXT,
      rating INTEGER DEFAULT 0,
      review TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )
  `);

  // 工资记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS salary_records (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      staff_name TEXT,
      month TEXT NOT NULL,
      order_count INTEGER DEFAULT 0,
      total_hours REAL DEFAULT 0,
      base_salary REAL DEFAULT 0,
      commission REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      subsidy REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      should_pay REAL DEFAULT 0,
      actual_pay REAL DEFAULT 0,
      status INTEGER DEFAULT 1,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )
  `);

  // 请假记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaves (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      staff_name TEXT,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )
  `);

  // 插入默认管理员（如果不存在）
  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get();
  if (adminCount.cnt === 0) {
    const insertAdmin = db.prepare('INSERT INTO admin_users (id, name, phone, password, role) VALUES (?, ?, ?, ?, ?)');
    insertAdmin.run(uuidv4(), '张经理', '13800001111', '123456', 'boss');
    insertAdmin.run(uuidv4(), '李客服', '13800002222', '123456', 'dispatcher');
    insertAdmin.run(uuidv4(), '王会计', '13800003333', '123456', 'finance');
  }

  // 插入默认阿姨（如果不存在）
  const staffCount = db.prepare('SELECT COUNT(*) as cnt FROM staff').get();
  if (staffCount.cnt === 0) {
    const insertStaff = db.prepare(`
      INSERT INTO staff (id, name, phone, password, avatar, skills, service_areas, salary_type, salary_config, status, entry_date, rating, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const staffData = [
      [uuidv4(), '张阿姨', '13900001111', '123456', '👩', '["日常保洁","深度保洁","擦玻璃"]', '["朝阳区","东城区"]', 1, '{"perOrder":{"日常保洁":80,"深度保洁":150,"擦玻璃":60}}', 1, '2024-03-15', 4.8, '认真负责'],
      [uuidv4(), '李阿姨', '13900002222', '123456', '👩‍🦱', '["日常保洁","做饭","带娃"]', '["海淀区","西城区"]', 2, '{"hourlyRate":45}', 1, '2024-06-01', 4.6, '擅长做饭'],
      [uuidv4(), '王阿姨', '13900003333', '123456', '👩‍🍳', '["月嫂","育儿嫂","做饭"]', '["朝阳区","丰台区"]', 3, '{"baseSalary":3000,"commissionRate":0.15}', 1, '2023-11-20', 4.9, '高级月嫂证'],
      [uuidv4(), '赵阿姨', '13900004444', '123456', '👩‍💼', '["日常保洁","深度保洁","收纳整理"]', '["朝阳区","通州区"]', 1, '{"perOrder":{"日常保洁":75,"深度保洁":140,"收纳整理":200}}', 1, '2025-01-10', 4.7, '整理达人'],
      [uuidv4(), '刘阿姨', '13900005555', '123456', '👵', '["日常保洁","擦玻璃"]', '["海淀区","昌平区"]', 2, '{"hourlyRate":40}', 2, '2024-09-01', 4.5, '请假中'],
      [uuidv4(), '陈阿姨', '13900006666', '123456', '👩‍🔧', '["日常保洁","深度保洁","家电清洗"]', '["西城区","东城区","朝阳区"]', 1, '{"perOrder":{"日常保洁":85,"深度保洁":160,"家电清洗":120}}', 1, '2025-04-15', 4.8, '专业家电清洗'],
    ];
    staffData.forEach(row => insertStaff.run(...row));
  }

  // 插入默认客户（如果不存在）
  const custCount = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();
  if (custCount.cnt === 0) {
    const insertCust = db.prepare(`
      INSERT INTO customers (id, name, phone, address, source, level, tags, last_service_date, total_orders, total_amount, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const custData = [
      [uuidv4(), '王女士', '13600001111', '朝阳区望京SOHO T1 12层', '微信', 2, '["定期保洁","有宠物"]', '2026-08-10', 15, 2850, '家里有金毛'],
      [uuidv4(), '李先生', '13600002222', '海淀区中关村软件园二期', '电话', 1, '["周末服务"]', '2026-08-05', 5, 680, '周末在家'],
      [uuidv4(), '张太太', '13600003333', '西城区金融街某小区3号楼', '转介绍', 3, '["SVIP","定期保洁"]', '2026-08-12', 32, 18600, '高净值客户'],
      [uuidv4(), '赵先生', '13600004444', '朝阳区三里屯SOHO', '美团', 1, '["深度保洁"]', '2026-07-20', 3, 450, '单身租房'],
      [uuidv4(), '孙女士', '13600005555', '丰台区方庄芳城园小区', '58同城', 2, '["定期保洁","带娃"]', '2026-08-08', 10, 3200, '有2岁小孩'],
    ];
    custData.forEach(row => insertCust.run(...row));
  }

  console.log('[数据库] 初始化完成');
}

module.exports = { getDb, initDatabase };
