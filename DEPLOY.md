# 部署为公开分享链接

前端是纯静态站点（零依赖、零构建），任何静态托管平台都能直接部署。
下面按「上手速度」排序，四种方式任选其一。

---

## 方式一：Netlify Drop（最快，60 秒，不用装任何东西）

1. 打开 https://app.netlify.com/drop
2. 把本机的 **`e:\S-F-E\S-F-E\frontend` 整个文件夹** 拖进网页
3. 上传完立刻得到公开链接，形如 `https://随机名.netlify.app`
4. （可选）注册登录后可在 Site settings → Change site name 改成好记的名字，
   例如 `https://jiazheng-paiban.netlify.app`

> 注意：拖 `frontend` 文件夹本身，不要拖整个项目根目录，否则首页会变成目录列表。

---

## 方式二：GitHub Pages（免费永久，适合长期分享 / 迭代）

仓库里已经放好自动部署流水线 `.github/workflows/deploy-pages.yml`，
推上去就会自动发布，之后每次 push 自动更新。

```bash
cd e:\S-F-E\S-F-E

# 1. 配置 git 身份（本机还没配过）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 2. 提交代码
git add .
git commit -m "feat: 家政排班与订单管理系统"

# 3. 在 GitHub 网页上新建一个空仓库（不要勾选 README/gitignore）
#    然后把下面的地址换成你自己的仓库地址
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

4. 打开仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
5. 等 Actions 跑完（约 1 分钟），链接为：
   `https://你的用户名.github.io/仓库名/`

---

## 方式三：Vercel（免费，自带 CDN，国内访问较快）

配置文件 `vercel.json` 已就绪。

```bash
cd e:\S-F-E\S-F-E
npx vercel@latest login      # 浏览器里授权
npx vercel@latest --prod     # 一路回车即可
```

部署完输出形如 `https://项目名.vercel.app` 的公开链接。

---

## 方式四：Cloudflare Pages（免费，全球加速）

```bash
cd e:\S-F-E\S-F-E
npx wrangler@latest login
npx wrangler@latest pages deploy frontend --project-name jiazheng-paiban
```

得到 `https://jiazheng-paiban.pages.dev`。

---

## 部署后自检清单

打开链接后逐项确认：

- [ ] 首页两张卡片能正常显示（管理后台 / 阿姨端 APP）
- [ ] 后台登录页左侧深色分屏正常，点演示账号能自动填入
- [ ] 登录后侧边栏出现，工作台 KPI 有数字（首次访问会自动生成演示数据）
- [ ] 排班日历能看到阿姨 × 7 天网格，格子里有彩色订单块
- [ ] 阿姨端在手机上打开，字大、按钮大，底部 Tab 正常
- [ ] 中文没有乱码（若乱码说明服务器 Content-Type 缺 charset，Netlify/Vercel/Pages 都不会有此问题）

---

## 分享时给对方的说明

> **家政排班与订单管理系统 · 演示版**
>
> 🖥 管理后台（电脑打开）：`你的链接/admin/index.html`
> 　　老板 `13800001111` / `123456`
> 　　调度员 `13800002222` / `123456`
>
> 📱 阿姨端 APP（手机打开）：`你的链接/app/index.html`
> 　　张阿姨 `13900001111` / `123456`
>
> 数据保存在各自浏览器本地，随便点、随便改，不会互相影响。
> 想恢复初始数据：后台 → 系统设置 → 重置演示数据。

---

## 关于后端

`backend/` 是 Node.js + SQLite 服务，**静态托管平台跑不了**，公开演示链接不需要它
（前端默认走浏览器 LocalStorage，功能完整）。

如果后续要真正多人协作、数据共享，再把后端部署到 Railway / Render / 阿里云，
然后把 `frontend/shared/scripts/api.js` 里的 `API_MODE` 改成 `'api'`、
`API_BASE` 指向后端地址即可。

---

## 数据与隐私提醒

- 演示数据都是虚构的（阿姨、客户姓名和手机号均为编造），可以公开分享。
- 部署后是**任何人都能访问**的公开页面，演示账号密码写在登录页上，
  请不要往里录入真实客户信息和真实手机号。
- 正式投产前必须：接后端、改掉演示账号、加真实鉴权。
