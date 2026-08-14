# 家政/保洁阿姨排班与订单管理系统

> 前后端分离 · 双端设计：**老板/调度员用电脑后台，阿姨用手机 APP**

## 🔗 在线演示

| 端 | 链接 | 演示账号 |
|---|---|---|
| 🖥 管理后台 | https://cuihaosir.github.io/jiazheng-paiban/admin/ | 老板 `13800001111` / `123456`<br>调度员 `13800002222` / `123456`<br>财务 `13800003333` / `123456` |
| 📱 阿姨端 APP | https://cuihaosir.github.io/jiazheng-paiban/app/ | 张阿姨 `13900001111` / `123456`<br>李阿姨 `13900002222` / `123456`<br>王阿姨 `13900003333` / `123456` |

入口页：https://cuihaosir.github.io/jiazheng-paiban/

> 数据保存在各自浏览器的 LocalStorage，多人访问互不影响，随便点。
> 想恢复初始数据：后台 → 系统设置 → 重置演示数据。
>
> ⚠️ 这是公开演示环境，演示账号密码是公开的，请勿录入真实客户信息。

## 两个使用端

| 端 | 使用者 | 设备 | 界面特征 |
|---|---|---|---|
| **管理后台** `frontend/admin` | 老板、调度员、财务 | 🖥 电脑浏览器 | 左侧导航栏 + 宽屏数据表格 + 排班网格 + 弹窗表单 |
| **阿姨端 APP** `frontend/app` | 服务人员（阿姨） | 📱 手机浏览器 | 480px 单列 + 大字体 + 大按钮 + 底部 Tab |

阿姨端按 50 岁左右用户设计：正文 16px 起，主操作按钮 18px / 高 52px，一屏只做一件事，
核心流程只有三步：**确认接单 → 我到了 → 服务完成**。

## 目录结构

```
├── frontend/                      # 前端（纯静态，零依赖）
│   ├── index.html                 # 入口：选择后台 or APP
│   │
│   ├── admin/                     # 🖥 管理后台（PC 桌面端）
│   │   ├── index.html             # 登录（左右分屏）
│   │   ├── dashboard.html         # 工作台：KPI + 今日订单表 + 待处理事项
│   │   ├── schedule.html          # 排班日历：阿姨 × 7天 网格，空格点击派单
│   │   ├── orders.html            # 订单管理：多条件筛选 + 分页 + 导出
│   │   ├── order-create.html      # 新建订单：左表单 + 右摘要，实时冲突检测
│   │   ├── order-detail.html      # 订单详情 + 改期/取消弹窗
│   │   ├── staff.html             # 阿姨管理：负荷可视化 + 新增弹窗
│   │   ├── staff-detail.html      # 阿姨档案：绩效、排班、工资规则
│   │   ├── customers.html         # 客户管理 + 复购标记
│   │   ├── customer-detail.html   # 客户档案：消费、常用阿姨、偏好
│   │   ├── salary.html            # 工资结算：明细表 + 计算过程弹窗 + 导出
│   │   ├── stats.html             # 数据统计：趋势、分布、排行、漏斗
│   │   ├── settings.html          # 系统设置
│   │   ├── styles/admin.css       # 桌面端设计体系
│   │   └── scripts/layout.js      # 侧边栏 + 登录守卫
│   │
│   ├── app/                       # 📱 阿姨端 APP（移动端）
│   │   ├── index.html             # 登录
│   │   ├── home.html              # 首页：今日安排 + 待接单提醒
│   │   ├── schedule.html          # 我的排班：周历 + 当天列表
│   │   ├── orders.html            # 我的订单：即将服务 / 历史
│   │   ├── order-detail.html      # 订单详情 + 四步流程条 + 服务计时
│   │   ├── salary.html            # 我的工资：明细 + 逐单核对
│   │   ├── leave.html             # 请假申请（自动提示冲突排班）
│   │   ├── me.html                # 我的：技能、区域、工资方式
│   │   ├── styles/app.css         # 移动端设计体系
│   │   └── scripts/app.js         # Tab 栏 + 公共逻辑
│   │
│   └── shared/scripts/            # 两端共享
│       ├── utils.js               # 工具函数（含时间重叠算法）
│       ├── mock-data.js           # 演示数据
│       ├── storage.js             # 数据层（LocalStorage）
│       └── api.js                 # HTTP 请求层（切后端用）
│
└── backend/                       # 后端 API（独立部署）
    ├── package.json
    ├── database/                  # SQLite 数据文件
    └── src/
        ├── index.js               # Express 入口
        ├── middleware/auth.js     # JWT 认证
        ├── models/database.js     # 建表 + 种子数据
        └── routes/                # auth / staff / customers / orders
                                   # schedule / salary / stats
```

## 快速启动

### 纯前端演示（推荐，无需后端）

```bash
cd frontend
npx serve . -p 5173
```

打开 http://localhost:5173 → 选择「管理后台」或「阿姨端 APP」。
数据存在浏览器 LocalStorage，首次打开自动生成演示数据。

> 也可以直接双击 `frontend/index.html` 用浏览器打开。

### 前后端联调

```bash
# 后端
cd backend
npm install
npm run dev          # http://localhost:3000

# 前端
cd frontend
npx serve . -p 5173  # http://localhost:5173
```

然后把 `frontend/shared/scripts/api.js` 里的 `API_MODE` 从 `'local'` 改成 `'api'`。

## 演示账号

**管理后台**（登录页可点击自动填入）

| 角色 | 手机号 | 密码 |
|---|---|---|
| 老板 | 13800001111 | 123456 |
| 调度员 | 13800002222 | 123456 |
| 财务 | 13800003333 | 123456 |

**阿姨端 APP**

| 姓名 | 手机号 | 密码 | 工资方式 |
|---|---|---|---|
| 张阿姨 | 13900001111 | 123456 | 按单结算 |
| 李阿姨 | 13900002222 | 123456 | 按小时 |
| 王阿姨 | 13900003333 | 123456 | 底薪+提成 |
| 赵阿姨 | 13900004444 | 123456 | 按单结算 |

## 核心能力

**排班不撞单** — 时间区间重叠算法（`新开始 < 旧结束 且 新结束 > 旧开始`），
派单和改期两处都做拦截，冲突时列出具体冲突订单。首尾相接（12:00 接 12:00）不算冲突。

**派单不漏单** — 派单页自动列出该时段所有空闲阿姨，按「技能匹配 + 区域匹配 + 评分 + 近期负荷」
打分排序并说明推荐理由；排班网格空白格直接点击即可带上阿姨和日期跳转派单。

**工资算得清** — 支持按单 / 按小时 / 底薪+提成 / 包月四种方式，读取该月「已完成」订单自动计算，
满 20 单加全勤奖，满 80 小时加交通补贴。后台可看每一笔的计算过程，阿姨端可逐单核对，
两边数字一致，避免扯皮。工资表可导出 CSV。

**其他** — 客户复购提醒（超 30 天未下单）、阿姨周负荷条（防忙闲不均）、
人力成本率（工资总额 / 营收）、订单状态漏斗、客户价值分层。

## 已验证

数据层通过 36 项冒烟测试：时间重叠算法边界、排班冲突检测、空闲阿姨查询、
四种工资计算方式与公式一致性、批量计算幂等、复购提醒阈值、订单状态流转与取消释放排班。

## 技术栈

前端：HTML5 + CSS3 + 原生 JavaScript，零框架零构建
后端：Node.js + Express + better-sqlite3 + JWT
