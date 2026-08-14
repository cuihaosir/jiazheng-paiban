/**
 * 模拟数据 - 家政排班系统
 */
const MockData = {
  /** 管理员账号 */
  adminUsers: [
    { id: 'admin001', name: '张经理', phone: '13800001111', role: 'boss', password: '123456' },
    { id: 'admin002', name: '李客服', phone: '13800002222', role: 'dispatcher', password: '123456' },
    { id: 'admin003', name: '王会计', phone: '13800003333', role: 'finance', password: '123456' }
  ],

  /** 阿姨信息 */
  staffList: [
    {
      id: 'staff001',
      name: '张阿姨',
      phone: '13900001111',
      password: '123456',
      avatar: '👩',
      idCard: '110101197001011234',
      skills: ['日常保洁', '深度保洁', '擦玻璃'],
      serviceAreas: ['朝阳区', '东城区'],
      salaryType: 1,
      salaryConfig: { perOrder: { '日常保洁': 80, '深度保洁': 150, '擦玻璃': 60 } },
      status: 1,
      entryDate: '2024-03-15',
      remark: '认真负责，客户反馈好',
      rating: 4.8
    },
    {
      id: 'staff002',
      name: '李阿姨',
      phone: '13900002222',
      password: '123456',
      avatar: '👩‍🦱',
      idCard: '110101198005052345',
      skills: ['日常保洁', '做饭', '带娃'],
      serviceAreas: ['海淀区', '西城区'],
      salaryType: 2,
      salaryConfig: { hourlyRate: 45 },
      status: 1,
      entryDate: '2024-06-01',
      remark: '擅长做饭和照顾小孩',
      rating: 4.6
    },
    {
      id: 'staff003',
      name: '王阿姨',
      phone: '13900003333',
      password: '123456',
      avatar: '👩‍🍳',
      idCard: '110101197508083456',
      skills: ['月嫂', '育儿嫂', '做饭'],
      serviceAreas: ['朝阳区', '丰台区'],
      salaryType: 3,
      salaryConfig: { baseSalary: 3000, commissionRate: 0.15 },
      status: 1,
      entryDate: '2023-11-20',
      remark: '持有高级月嫂证',
      rating: 4.9
    },
    {
      id: 'staff004',
      name: '赵阿姨',
      phone: '13900004444',
      password: '123456',
      avatar: '👩‍💼',
      idCard: '110101198212124567',
      skills: ['日常保洁', '深度保洁', '收纳整理'],
      serviceAreas: ['朝阳区', '通州区'],
      salaryType: 1,
      salaryConfig: { perOrder: { '日常保洁': 75, '深度保洁': 140, '收纳整理': 200 } },
      status: 1,
      entryDate: '2025-01-10',
      remark: '整理收纳达人',
      rating: 4.7
    },
    {
      id: 'staff005',
      name: '刘阿姨',
      phone: '13900005555',
      password: '123456',
      avatar: '👵',
      idCard: '110101196906065678',
      skills: ['日常保洁', '擦玻璃'],
      serviceAreas: ['海淀区', '昌平区'],
      salaryType: 2,
      salaryConfig: { hourlyRate: 40 },
      status: 2,
      entryDate: '2024-09-01',
      remark: '目前请假中',
      rating: 4.5
    },
    {
      id: 'staff006',
      name: '陈阿姨',
      phone: '13900006666',
      password: '123456',
      avatar: '👩‍🔧',
      idCard: '110101198803037890',
      skills: ['日常保洁', '深度保洁', '家电清洗'],
      serviceAreas: ['西城区', '东城区', '朝阳区'],
      salaryType: 1,
      salaryConfig: { perOrder: { '日常保洁': 85, '深度保洁': 160, '家电清洗': 120 } },
      status: 1,
      entryDate: '2025-04-15',
      remark: '专业家电清洗技能',
      rating: 4.8
    }
  ],

  /** 客户信息 */
  customerList: [
    {
      id: 'cust001',
      name: '王女士',
      phone: '13600001111',
      address: '朝阳区望京SOHO T1 12层',
      source: '微信',
      level: 2,
      tags: ['定期保洁', '有宠物'],
      lastServiceDate: '2026-08-10',
      totalOrders: 15,
      totalAmount: 2850,
      remark: '家里有一只金毛，需要注意宠物毛发'
    },
    {
      id: 'cust002',
      name: '李先生',
      phone: '13600002222',
      address: '海淀区中关村软件园二期',
      source: '电话',
      level: 1,
      tags: ['周末服务'],
      lastServiceDate: '2026-08-05',
      totalOrders: 5,
      totalAmount: 680,
      remark: '周末才在家'
    },
    {
      id: 'cust003',
      name: '张太太',
      phone: '13600003333',
      address: '西城区金融街某小区3号楼',
      source: '转介绍',
      level: 3,
      tags: ['SVIP', '定期保洁', '月嫂需求'],
      lastServiceDate: '2026-08-12',
      totalOrders: 32,
      totalAmount: 18600,
      remark: '高净值客户，服务要求高'
    },
    {
      id: 'cust004',
      name: '赵先生',
      phone: '13600004444',
      address: '朝阳区三里屯SOHO',
      source: '美团',
      level: 1,
      tags: ['深度保洁'],
      lastServiceDate: '2026-07-20',
      totalOrders: 3,
      totalAmount: 450,
      remark: '单身租房客'
    },
    {
      id: 'cust005',
      name: '孙女士',
      phone: '13600005555',
      address: '丰台区方庄芳城园小区',
      source: '58同城',
      level: 2,
      tags: ['定期保洁', '带娃'],
      lastServiceDate: '2026-08-08',
      totalOrders: 10,
      totalAmount: 3200,
      remark: '有2岁小孩，需要使用环保清洁剂'
    }
  ],

  /** 订单数据 */
  orderList: [],

  /** 生成模拟订单（基于当前日期动态生成） */
  generateOrders() {
    const now = new Date();
    const orders = [];
    const serviceTypes = ['日常保洁', '深度保洁', '擦玻璃', '做饭', '收纳整理', '家电清洗'];

    // 生成过去30天到未来7天的订单
    for (let i = -30; i <= 7; i++) {
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() + i);

      // 每天2-4个订单
      const orderCount = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < orderCount; j++) {
        const startHour = 8 + Math.floor(Math.random() * 8); // 8-15点
        const duration = [2, 3, 4][Math.floor(Math.random() * 3)];
        const staffIdx = Math.floor(Math.random() * 5); // 前5个阿姨（排除请假的）
        const custIdx = Math.floor(Math.random() * 5);
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];

        const startTime = new Date(orderDate);
        startTime.setHours(startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startHour + duration);

        let status;
        if (i < -2) status = Math.random() > 0.1 ? 4 : 0; // 已完成或取消
        else if (i < 0) status = Math.random() > 0.3 ? 4 : 3; // 已完成或已上门
        else if (i === 0) status = [2, 3][Math.floor(Math.random() * 2)]; // 今天的
        else status = [1, 2][Math.floor(Math.random() * 2)]; // 未来的

        const amount = [80, 150, 60, 100, 200, 120][serviceTypes.indexOf(serviceType)] * (duration / 2);
        const staff = this.staffList[staffIdx];
        const customer = this.customerList[custIdx];

        orders.push({
          id: 'order' + Utils.generateId(),
          orderNo: 'JZ' + Utils.formatDate(startTime.toISOString(), 'YYYYMMDD') + String(j + 1).padStart(4, '0'),
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          staffId: staff.id,
          staffName: staff.name,
          serviceType: serviceType,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: duration,
          address: customer.address,
          amount: amount,
          status: status,
          source: ['微信', '电话', '美团', '58同城', '转介绍'][Math.floor(Math.random() * 5)],
          remark: '',
          cancelReason: status === 0 ? '客户临时有事' : '',
          rating: status === 5 ? Math.floor(Math.random() * 2) + 4 : 0,
          createdAt: new Date(startTime.getTime() - 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    return orders;
  },

  /** 请假记录 */
  leaveList: [
    {
      id: 'leave001',
      staffId: 'staff005',
      staffName: '刘阿姨',
      type: '事假',
      startDate: '2026-08-10',
      endDate: '2026-08-20',
      reason: '家中有事',
      status: 2 // 1待审批 2已通过 3已拒绝
    }
  ],

  /** 工资记录 */
  salaryRecords: []
};
