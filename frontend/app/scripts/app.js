/**
 * 阿姨端 APP 公共逻辑
 */
const App = {
  /** 登录守卫 */
  guard() {
    if (!UserStorage.isLoggedIn() || UserStorage.getRole() !== 'staff') {
      location.href = 'index.html';
      return false;
    }
    return true;
  },

  /** 初始化：守卫 + 数据 + 渲染Tab */
  init(activeTab) {
    if (!this.guard()) return false;
    initAllData();
    if (activeTab) this.renderTabbar(activeTab);
    return true;
  },

  /** 当前用户 */
  me() { return UserStorage.get(); },

  /** 我的订单 */
  myOrders() {
    return OrderStorage.getByStaff(this.me().id);
  },

  /** 当前阿姨的完整档案（含工资规则），带缓存 */
  profile() {
    if (!this._profile) this._profile = StaffStorage.getById(this.me().id);
    return this._profile;
  },

  /** 这一单我能拿多少（不是客户付的钱） */
  myPay(order) {
    return SalaryStorage.orderPay(this.profile(), order);
  },

  /** 一批订单我的总收入 */
  myPayTotal(orders) {
    const p = this.profile();
    return Math.round(orders.reduce((sum, o) => sum + SalaryStorage.orderPay(p, o).pay, 0) * 100) / 100;
  },

  /** 待接单数量（用于Tab红点） */
  pendingCount() {
    return this.myOrders().filter(o => o.status === 1).length;
  },

  /** 渲染底部Tab */
  renderTabbar(active) {
    const pending = this.pendingCount();
    const tabs = [
      { key: 'home', icon: '🏠', name: '首页', href: 'home.html' },
      { key: 'schedule', icon: '📅', name: '排班', href: 'schedule.html' },
      { key: 'orders', icon: '📋', name: '订单', href: 'orders.html', badge: pending },
      { key: 'salary', icon: '💰', name: '工资', href: 'salary.html' },
      { key: 'me', icon: '👤', name: '我的', href: 'me.html' }
    ];

    const el = document.createElement('nav');
    el.className = 'tabbar';
    el.innerHTML = tabs.map(t => `
      <a class="tab ${t.key === active ? 'on' : ''}" href="${t.href}">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.name}</span>
        ${t.badge ? `<span class="tab-dot">${t.badge}</span>` : ''}
      </a>`).join('');
    document.body.appendChild(el);
  },

  /** 退出登录 */
  logout() {
    if (!confirm('确定退出登录？')) return;
    UserStorage.logout();
    location.href = 'index.html';
  },

  /** 订单状态 CSS 后缀 */
  stCls(status) {
    return Utils.getOrderStatusClass(status);
  },

  /** 打电话 */
  call(phone) {
    location.href = 'tel:' + phone;
  },

  /** 渲染一个订单卡片（金额一律显示「我的收入」，不显示客户付款额，避免误解） */
  jobCard(o, opts) {
    opts = opts || {};
    const showDate = opts.showDate;
    const mp = this.myPay(o);
    return `
      <div class="job st-${this.stCls(o.status)}" onclick="location.href='order-detail.html?id=${o.id}'">
        <div class="job-head">
          <span class="job-time">${showDate ? Utils.formatDate(o.startTime, 'MM/DD') + ' ' : ''}${Utils.formatDate(o.startTime, 'HH:mm')}–${Utils.formatDate(o.endTime, 'HH:mm')}</span>
          <span class="tag tag-${this.stCls(o.status)}">${Utils.getOrderStatusName(o.status)}</span>
        </div>
        <div class="job-type">${o.serviceType} · ${o.duration} 小时</div>
        <div class="job-line"><span class="job-line-icon">👤</span><span>${o.customerName}</span></div>
        <div class="job-line"><span class="job-line-icon">📍</span><span>${o.address}</span></div>
        <div class="job-foot">
          <span>
            <span class="job-money">${mp.perOrderBased ? Utils.formatMoney(mp.pay) : '包月'}</span>
            <span class="job-money-label">${mp.perOrderBased ? '我的收入' : '不按单计酬'}</span>
          </span>
          <span style="font-size:14px;color:var(--text-tertiary)">查看详情 ›</span>
        </div>
      </div>`;
  }
};
