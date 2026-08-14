/**
 * 工具函数库
 */
const Utils = {
  /** 显示 Toast 提示 */
  toast(msg, duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  },

  /** 生成随机ID */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  /** 生成订单号 */
  generateOrderNo() {
    const now = new Date();
    const prefix = 'JZ';
    const date = this.formatDate(now.toISOString(), 'YYYYMMDD');
    const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return prefix + date + seq;
  },

  /** 格式化日期 */
  formatDate(dateStr, fmt = 'YYYY-MM-DD') {
    const d = new Date(dateStr);
    const map = {
      'YYYY': d.getFullYear(),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'DD': String(d.getDate()).padStart(2, '0'),
      'HH': String(d.getHours()).padStart(2, '0'),
      'mm': String(d.getMinutes()).padStart(2, '0')
    };
    let result = fmt;
    for (const [k, v] of Object.entries(map)) {
      result = result.replace(k, v);
    }
    return result;
  },

  /** 格式化日期为友好格式 */
  formatDateFriendly(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff === -1) return '明天';
    if (diff < 7 && diff > 0) return diff + '天前';
    return this.formatDate(dateStr, 'MM-DD');
  },

  /** 格式化时间段 */
  formatTimeRange(start, end) {
    return this.formatDate(start, 'HH:mm') + ' - ' + this.formatDate(end, 'HH:mm');
  },

  /** 计算小时差 */
  hoursBetween(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e - s) / (1000 * 60 * 60) * 10) / 10;
  },

  /** 计算天数差 */
  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  /** 验证手机号 */
  validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  /** 获取本周一日期 */
  getMonday(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /** 获取星期几 */
  getWeekDay(dateStr) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return '周' + days[new Date(dateStr).getDay()];
  },

  /** 格式化金额 */
  formatMoney(amount) {
    return '¥' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /** 获取订单状态名称 */
  getOrderStatusName(status) {
    const map = {
      1: '待确认',
      2: '已确认',
      3: '已上门',
      4: '已完成',
      5: '已评价',
      0: '已取消'
    };
    return map[status] || '未知';
  },

  /** 获取订单状态CSS类 */
  getOrderStatusClass(status) {
    const map = {
      1: 'pending',
      2: 'confirmed',
      3: 'ongoing',
      4: 'completed',
      5: 'rated',
      0: 'cancelled'
    };
    return map[status] || '';
  },

  /** 获取工资类型名称 */
  getSalaryTypeName(type) {
    const map = {
      1: '按单结算',
      2: '按小时结算',
      3: '底薪+提成',
      4: '包月固定'
    };
    return map[type] || '未知';
  },

  /** 检查时间重叠 */
  isTimeOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  },

  /** URL参数获取 */
  getParam(key) {
    return new URLSearchParams(location.search).get(key);
  },

  /** 获取当前月份 YYYY-MM */
  getCurrentMonth() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
};
