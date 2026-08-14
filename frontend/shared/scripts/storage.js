/**
 * 数据存储层 - LocalStorage 封装
 * 前缀: jz_ (家政)
 */

/** 用户会话存储 */
const UserStorage = {
  _key: 'jz_user',

  save(user) {
    try {
      localStorage.setItem(this._key, JSON.stringify(user));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足，请清理数据');
      }
    }
  },

  get() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || 'null');
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() { return !!this.get(); },

  getRole() {
    const user = this.get();
    return user ? user.role : null;
  },

  logout() { localStorage.removeItem(this._key); }
};

/** 阿姨数据存储 */
const StaffStorage = {
  _key: 'jz_staff',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足');
      }
    }
  },

  getById(id) {
    return this.getAll().find(item => item.id === id) || null;
  },

  getByPhone(phone) {
    return this.getAll().find(item => item.phone === phone) || null;
  },

  add(staff) {
    const list = this.getAll();
    staff.id = staff.id || 'staff' + Utils.generateId();
    list.push(staff);
    this.save(list);
    return staff;
  },

  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
      this.save(list);
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll().filter(s => s.id !== id);
    this.save(list);
  },

  /** 获取空闲阿姨（指定时间段无订单的） */
  getAvailable(startTime, endTime, serviceType, area) {
    const allStaff = this.getAll().filter(s => s.status === 1);
    const orders = OrderStorage.getAll();

    return allStaff.filter(staff => {
      // 技能匹配
      if (serviceType && !staff.skills.includes(serviceType)) return false;
      // 区域匹配
      if (area && !staff.serviceAreas.some(a => area.includes(a))) return false;
      // 时间冲突检测
      const hasConflict = orders.some(order =>
        order.staffId === staff.id &&
        order.status !== 0 &&
        Utils.isTimeOverlap(startTime, endTime, order.startTime, order.endTime)
      );
      return !hasConflict;
    });
  },

  /** 获取活跃阿姨数 */
  getActiveCount() {
    return this.getAll().filter(s => s.status === 1).length;
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    this.save(MockData.staffList);
  }
};

/** 客户数据存储 */
const CustomerStorage = {
  _key: 'jz_customers',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足');
      }
    }
  },

  getById(id) {
    return this.getAll().find(item => item.id === id) || null;
  },

  getByPhone(phone) {
    return this.getAll().find(item => item.phone === phone) || null;
  },

  add(customer) {
    const list = this.getAll();
    customer.id = customer.id || 'cust' + Utils.generateId();
    customer.totalOrders = customer.totalOrders || 0;
    customer.totalAmount = customer.totalAmount || 0;
    list.push(customer);
    this.save(list);
    return customer;
  },

  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
      this.save(list);
      return list[idx];
    }
    return null;
  },

  /** 获取需要复购提醒的客户（超过30天未下单） */
  getRepurchaseReminders() {
    const now = new Date();
    return this.getAll().filter(c => {
      if (!c.lastServiceDate) return false;
      return Utils.daysBetween(c.lastServiceDate, now.toISOString()) > 30;
    });
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    this.save(MockData.customerList);
  }
};

/** 订单数据存储 */
const OrderStorage = {
  _key: 'jz_orders',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足');
      }
    }
  },

  getById(id) {
    return this.getAll().find(item => item.id === id) || null;
  },

  getByStaff(staffId) {
    return this.getAll().filter(o => o.staffId === staffId);
  },

  getByCustomer(customerId) {
    return this.getAll().filter(o => o.customerId === customerId);
  },

  add(order) {
    const list = this.getAll();
    order.id = order.id || 'order' + Utils.generateId();
    order.orderNo = order.orderNo || Utils.generateOrderNo();
    order.createdAt = order.createdAt || new Date().toISOString();
    list.unshift(order);
    this.save(list);
    return order;
  },

  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(o => o.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
      this.save(list);
      return list[idx];
    }
    return null;
  },

  /** 检查排班冲突 */
  checkConflict(staffId, startTime, endTime, excludeOrderId) {
    return this.getAll().filter(order =>
      order.staffId === staffId &&
      order.status !== 0 &&
      order.id !== excludeOrderId &&
      Utils.isTimeOverlap(startTime, endTime, order.startTime, order.endTime)
    );
  },

  /** 获取指定日期范围的订单 */
  getByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.getAll().filter(o => {
      const t = new Date(o.startTime).getTime();
      return t >= start && t <= end;
    });
  },

  /** 获取今日订单 */
  getTodayOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getByDateRange(today.toISOString(), tomorrow.toISOString());
  },

  /** 获取本月完成订单 */
  getMonthCompleted(month) {
    const m = month || Utils.getCurrentMonth();
    const [year, mon] = m.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    return this.getAll().filter(o => {
      const t = new Date(o.startTime);
      return t >= start && t < end && o.status === 4;
    });
  },

  /** 统计数据 */
  getStats() {
    const all = this.getAll();
    const today = this.getTodayOrders();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = all.filter(o => new Date(o.startTime) >= monthStart);
    const monthCompleted = monthOrders.filter(o => o.status === 4);
    const monthRevenue = monthCompleted.reduce((sum, o) => sum + o.amount, 0);

    return {
      total: all.length,
      todayCount: today.length,
      todayPending: today.filter(o => o.status === 1 || o.status === 2).length,
      monthOrders: monthOrders.length,
      monthCompleted: monthCompleted.length,
      monthRevenue: monthRevenue,
      cancelRate: monthOrders.length > 0
        ? Math.round(monthOrders.filter(o => o.status === 0).length / monthOrders.length * 100)
        : 0
    };
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    this.save(MockData.generateOrders());
  }
};

/** 工资记录存储 */
const SalaryStorage = {
  _key: 'jz_salary',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足');
      }
    }
  },

  getByMonth(month) {
    return this.getAll().filter(r => r.month === month);
  },

  getByStaff(staffId, month) {
    return this.getAll().find(r => r.staffId === staffId && r.month === month) || null;
  },

  /**
   * 单笔订单「阿姨应得」——口径与月度工资计算完全一致
   * 注意：订单金额是客户付款，阿姨应得由其工资规则决定，两者不同
   * @returns {{pay:number, note:string, perOrderBased:boolean}}
   */
  orderPay(staff, order) {
    if (!staff || !order) return { pay: 0, note: '', perOrderBased: false };
    const cfg = staff.salaryConfig || {};

    switch (staff.salaryType) {
      case 1: { // 按单结算
        const table = cfg.perOrder || {};
        const v = table[order.serviceType] === undefined ? 80 : table[order.serviceType];
        return { pay: v, note: '按单计酬 ' + v + ' 元/单', perOrderBased: true };
      }
      case 2: { // 按小时
        const r = cfg.hourlyRate || 0;
        return {
          pay: Math.round((order.duration || 0) * r * 100) / 100,
          note: (order.duration || 0) + ' 小时 × ' + r + ' 元/时',
          perOrderBased: true
        };
      }
      case 3: { // 底薪+提成
        const r = cfg.commissionRate || 0;
        return {
          pay: Math.round((order.amount || 0) * r * 100) / 100,
          note: '提成 ' + Math.round(r * 100) + '%，另有月底薪 ' + (cfg.baseSalary || 0) + ' 元',
          perOrderBased: true
        };
      }
      case 4: // 包月
        return {
          pay: 0,
          note: '包月固定 ' + (cfg.monthlyPay || 0) + ' 元/月，不按单计酬',
          perOrderBased: false
        };
    }
    return { pay: 0, note: '', perOrderBased: false };
  },

  /** 计算单个阿姨工资 */
  calculateSalary(staffId, month) {
    const staff = StaffStorage.getById(staffId);
    if (!staff) return null;

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const completedOrders = OrderStorage.getAll().filter(o =>
      o.staffId === staffId &&
      o.status === 4 &&
      new Date(o.startTime) >= start &&
      new Date(o.startTime) < end
    );

    const orderCount = completedOrders.length;
    const totalHours = completedOrders.reduce((sum, o) => sum + (o.duration || 0), 0);
    let baseSalary = 0, commission = 0;

    switch (staff.salaryType) {
      case 1: // 按单结算
        baseSalary = completedOrders.reduce((sum, o) => {
          const rate = staff.salaryConfig.perOrder[o.serviceType] || 80;
          return sum + rate;
        }, 0);
        break;
      case 2: // 按小时
        baseSalary = totalHours * (staff.salaryConfig.hourlyRate || 40);
        break;
      case 3: // 底薪+提成
        baseSalary = staff.salaryConfig.baseSalary || 3000;
        commission = completedOrders.reduce((sum, o) => sum + o.amount * (staff.salaryConfig.commissionRate || 0.15), 0);
        break;
      case 4: // 包月
        baseSalary = staff.salaryConfig.monthlyPay || 5000;
        break;
    }

    const bonus = orderCount >= 20 ? 200 : 0; // 全勤奖示例
    const subsidy = totalHours >= 80 ? 100 : 0; // 交通补贴示例
    const deduction = 0;
    const shouldPay = baseSalary + commission + bonus + subsidy - deduction;

    return {
      id: 'sal' + Utils.generateId(),
      staffId: staff.id,
      staffName: staff.name,
      month: month,
      orderCount: orderCount,
      totalHours: totalHours,
      baseSalary: Math.round(baseSalary * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      bonus: bonus,
      subsidy: subsidy,
      deduction: deduction,
      shouldPay: Math.round(shouldPay * 100) / 100,
      actualPay: Math.round(shouldPay * 100) / 100,
      status: 1,
      createdAt: new Date().toISOString()
    };
  },

  /** 批量计算当月所有阿姨工资 */
  calculateAll(month) {
    const staff = StaffStorage.getAll().filter(s => s.status !== 3);
    const results = staff.map(s => this.calculateSalary(s.id, month)).filter(Boolean);
    // 保存
    const existing = this.getAll().filter(r => r.month !== month);
    this.save([...existing, ...results]);
    return results;
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    // 生成上个月工资
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = lastMonth.getFullYear() + '-' + String(lastMonth.getMonth() + 1).padStart(2, '0');
    this.calculateAll(month);
  }
};

/** 会员储值流水存储 */
const BalanceStorage = {
  _key: 'jz_balance_logs',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) Utils.toast('存储空间不足');
    }
  },

  getByCustomer(customerId) {
    return this.getAll().filter(r => r.customerId === customerId);
  },

  /**
   * 充值
   * @param {string} customerId
   * @param {number} amount 实付金额
   * @param {number} bonus 赠送金额
   */
  recharge(customerId, amount, bonus, remark, operator) {
    const c = CustomerStorage.getById(customerId);
    if (!c) return null;
    const gain = Number(amount) + Number(bonus || 0);
    const before = Number(c.balance || 0);
    const after = Math.round((before + gain) * 100) / 100;

    CustomerStorage.update(customerId, { balance: after });

    const log = {
      id: 'bal' + Utils.generateId(),
      customerId: customerId,
      customerName: c.name,
      type: 'recharge',
      amount: Number(amount),
      bonus: Number(bonus || 0),
      change: gain,
      balanceBefore: before,
      balanceAfter: after,
      orderId: '',
      remark: remark || '',
      operator: operator || '',
      time: new Date().toISOString()
    };
    const list = this.getAll();
    list.unshift(log);
    this.save(list);
    return log;
  },

  /** 消费扣款（余额不足返回 null） */
  consume(customerId, amount, orderId, remark, operator) {
    const c = CustomerStorage.getById(customerId);
    if (!c) return null;
    const before = Number(c.balance || 0);
    if (before < Number(amount)) return null;
    const after = Math.round((before - Number(amount)) * 100) / 100;

    CustomerStorage.update(customerId, { balance: after });

    const log = {
      id: 'bal' + Utils.generateId(),
      customerId: customerId,
      customerName: c.name,
      type: 'consume',
      amount: Number(amount),
      bonus: 0,
      change: -Number(amount),
      balanceBefore: before,
      balanceAfter: after,
      orderId: orderId || '',
      remark: remark || '',
      operator: operator || '',
      time: new Date().toISOString()
    };
    const list = this.getAll();
    list.unshift(log);
    this.save(list);
    return log;
  },

  /** 退款/手动调整 */
  adjust(customerId, delta, remark, operator) {
    const c = CustomerStorage.getById(customerId);
    if (!c) return null;
    const before = Number(c.balance || 0);
    const after = Math.round((before + Number(delta)) * 100) / 100;
    if (after < 0) return null;

    CustomerStorage.update(customerId, { balance: after });

    const log = {
      id: 'bal' + Utils.generateId(),
      customerId: customerId,
      customerName: c.name,
      type: 'adjust',
      amount: Math.abs(Number(delta)),
      bonus: 0,
      change: Number(delta),
      balanceBefore: before,
      balanceAfter: after,
      orderId: '',
      remark: remark || '',
      operator: operator || '',
      time: new Date().toISOString()
    };
    const list = this.getAll();
    list.unshift(log);
    this.save(list);
    return log;
  },

  /** 全部客户储值总额 */
  totalBalance() {
    return CustomerStorage.getAll().reduce((sum, c) => sum + Number(c.balance || 0), 0);
  }
};

/**
 * 渠道订单存储（示意实现）
 * ⚠️ 真实对接说明：美团、58 同城均未提供对外开放的订单查询 API，
 * 实际接入需与平台签署商务合作、获取商家授权后使用其服务商接口。
 * 此处用本地模拟数据演示「拉取平台订单 → 确认导入 → 转为系统订单派单」的完整流程。
 */
const ChannelStorage = {
  _key: 'jz_channel_orders',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) Utils.toast('存储空间不足');
    }
  },

  getById(id) {
    return this.getAll().find(x => x.id === id) || null;
  },

  getPending() {
    return this.getAll().filter(x => x.status === 'pending');
  },

  /** 模拟「同步平台订单」：把待导入订单的日期刷新为未来 1-5 天 */
  sync() {
    const list = this.getAll();
    list.forEach(o => {
      if (o.status === 'pending' && !o.date) {
        const d = new Date();
        d.setDate(d.getDate() + 1 + Math.floor(Math.random() * 5));
        o.date = Utils.formatDate(d.toISOString());
      }
    });
    this.save(list);
    return this.getPending();
  },

  /** 标记为已导入，并记录生成的系统订单号 */
  markImported(id, orderId, orderNo) {
    const list = this.getAll();
    const i = list.findIndex(x => x.id === id);
    if (i >= 0) {
      list[i].status = 'imported';
      list[i].systemOrderId = orderId;
      list[i].systemOrderNo = orderNo;
      list[i].importedAt = new Date().toISOString();
      this.save(list);
    }
  },

  /** 忽略某条平台订单 */
  ignore(id, reason) {
    const list = this.getAll();
    const i = list.findIndex(x => x.id === id);
    if (i >= 0) {
      list[i].status = 'ignored';
      list[i].ignoreReason = reason || '';
      this.save(list);
    }
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    this.save(MockData.channelOrders.map(o => Object.assign({}, o)));
    this.sync();
  }
};

/**
 * 通知记录存储（短信/微信通知 · 示意实现）
 * ⚠️ 真实发送需后端对接短信服务商（如阿里云短信、腾讯云 SMS），
 * 需企业实名认证并报备模板。此处仅记录「本应发送」的通知，用于演示流程。
 */
const NotifyStorage = {
  _key: 'jz_notify_logs',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) Utils.toast('存储空间不足');
    }
  },

  /** 记录一条模拟通知 */
  push(type, toName, toPhone, content, orderId) {
    const list = this.getAll();
    list.unshift({
      id: 'nt' + Utils.generateId(),
      type: type,
      toName: toName,
      toPhone: toPhone,
      content: content,
      orderId: orderId || '',
      channel: '短信（模拟）',
      time: new Date().toISOString()
    });
    this.save(list.slice(0, 200));
    return list[0];
  },

  getByOrder(orderId) {
    return this.getAll().filter(x => x.orderId === orderId);
  }
};

/** 请假记录存储 */
const LeaveStorage = {
  _key: 'jz_leaves',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this._key, JSON.stringify(list));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Utils.toast('存储空间不足');
      }
    }
  },

  add(leave) {
    const list = this.getAll();
    leave.id = leave.id || 'leave' + Utils.generateId();
    list.unshift(leave);
    this.save(list);
    return leave;
  },

  getByStaff(staffId) {
    return this.getAll().filter(l => l.staffId === staffId);
  },

  initMockData() {
    if (this.getAll().length > 0) return;
    this.save(MockData.leaveList);
  }
};

/** 初始化所有模拟数据 */
function initAllData() {
  StaffStorage.initMockData();
  CustomerStorage.initMockData();
  OrderStorage.initMockData();
  LeaveStorage.initMockData();
  SalaryStorage.initMockData();
  ChannelStorage.initMockData();
}
