/**
 * 后台布局 - 侧边栏渲染 + 登录守卫
 */
const AdminLayout = {
  menu: [
    { group: '业务' },
    { key: 'dashboard', icon: '📊', name: '工作台', href: 'dashboard.html' },
    { key: 'schedule', icon: '📅', name: '排班日历', href: 'schedule.html' },
    { key: 'orders', icon: '📋', name: '订单管理', href: 'orders.html' },
    { key: 'channels', icon: '🔗', name: '渠道对接', href: 'channels.html' },
    { group: '资源' },
    { key: 'staff', icon: '👩', name: '阿姨管理', href: 'staff.html' },
    { key: 'customers', icon: '👥', name: '客户管理', href: 'customers.html' },
    { group: '财务与分析' },
    { key: 'salary', icon: '💰', name: '工资结算', href: 'salary.html' },
    { key: 'stats', icon: '📈', name: '数据统计', href: 'stats.html' },
    { group: '系统' },
    { key: 'notify', icon: '📨', name: '通知记录', href: 'notify.html' },
    { key: 'settings', icon: '⚙️', name: '系统设置', href: 'settings.html' }
  ],

  roleNames: { boss: '老板', dispatcher: '调度员', finance: '财务' },

  /** 守卫：未登录或角色为阿姨则跳转 */
  guard() {
    if (!UserStorage.isLoggedIn() || UserStorage.getRole() === 'staff') {
      location.href = 'index.html';
      return false;
    }
    return true;
  },

  /** 渲染侧边栏，activeKey 为当前页 */
  render(activeKey) {
    const user = UserStorage.get();
    if (!user) return;

    const navHtml = this.menu.map(m => {
      if (m.group) return `<div class="nav-group-label">${m.group}</div>`;
      return `<a class="nav-item ${m.key === activeKey ? 'active' : ''}" href="${m.href}">
        <span class="nav-item-icon">${m.icon}</span><span>${m.name}</span>
      </a>`;
    }).join('');

    const el = document.createElement('aside');
    el.className = 'sidebar';
    el.innerHTML = `
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon">🏠</span>
        <span class="sidebar-brand-text">家政排班系统</span>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${user.name.charAt(0)}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${this.roleNames[user.role] || '管理员'}</div>
          </div>
          <button class="sidebar-logout" title="退出登录" onclick="AdminLayout.logout()">⏏</button>
        </div>
      </div>
    `;
    document.body.insertBefore(el, document.body.firstChild);
  },

  logout() {
    if (!confirm('确定退出登录？')) return;
    UserStorage.logout();
    location.href = 'index.html';
  },

  /** 初始化：守卫 + 渲染 + 数据初始化 */
  init(activeKey) {
    if (!this.guard()) return false;
    initAllData();
    this.render(activeKey);
    return true;
  }
};
