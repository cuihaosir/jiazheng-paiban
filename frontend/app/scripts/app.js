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

  /** 渲染一个订单卡片 */
  jobCard(o, opts) {
    opts = opts || {};
    const showDate = opts.showDate;
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
          <span class="job-money">${Utils.formatMoney(o.amount)}</span>
          <span style="font-size:14px;color:var(--text-tertiary)">查看详情 ›</span>
        </div>
      </div>`;
  }
};
