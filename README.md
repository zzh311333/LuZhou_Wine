# 泸州老窖科普知识平台

一个面向年轻人的泸州老窖科普网站。用通俗的语言讲清楚泸州老窖的历史、工艺、产品、数字化与经营，配有可搜索的文章库和趣味问答，帮助对白酒还不熟悉的人快速入门。

## 在线访问

**无需安装或启动本地服务，直接打开网页即可浏览：**

👉 [泸州老窖科普知识平台](https://6a9d645dbe30ee0194effe5c--jazzy-centaur-ae9eb1.netlify.app/)

该网页由 Netlify 托管，首页、文章、分类、搜索和问答都能直接在线使用。公网版本是发布时的只读快照，后台管理仍在本机使用。

## 功能

- 科普文章：14 篇，涵盖历史、品牌、工艺、数字化、经营等主题
- 分类浏览：按主题浏览文章
- 全文搜索：即时搜索文章标题与内容
- 趣味问答：30 道选择题，边答边学
- 后台管理：本地增删改文章、分类和题库（需启动后端）

## 技术栈

- 前端：Vue 3、Vite、Pinia、Vue Router、Element Plus、markdown-it、Fuse.js
- 后端：Express、better-sqlite3、JWT（用于后台管理）

## 环境要求

- Node.js 22.18 或更高（Vite 8 要求较新版本，推荐 22.x 或 24.x）

## 快速开始

**注意：必须先运行下面的命令把服务启动起来，等终端显示启动成功后再打开网址。** 如果直接打开网址，浏览器会提示"无法访问 / 拒绝连接"，这是正常的，说明服务还没启动。

### 方式一：本地预览（不需要后端）

打开终端，进入本项目目录，运行：

```bash
npm install
npm run dev
```

等终端出现 `Local: http://localhost:5173/` 的字样后，浏览器会自动打开网站（若没自动打开，手动访问 http://localhost:5173）。首页、分类、文章、搜索、问答都能正常浏览，**不需要启动后端**。

### 方式二：完整本地（带后台管理）

在方式一的基础上，另外开一个终端启动后端：

```bash
cd server
npm install
npm run dev
```

后端默认运行在 3000 端口。访问 http://localhost:5173/admin 登录后台。

> 默认管理员账号见 `server/db.js` 的种子逻辑，登录后请尽快修改密码。

## 构建与部署

构建生产版本：

```bash
npm run build
```

产物在 `dist/`，是一个完整的前端静态站点，可部署到任意静态托管平台。本地预览产物：

```bash
npm run preview
```

如果通过后台修改过内容，需先导出数据再构建：

```bash
npm run publish   # 等于 node server/export.js && vite build
```

### 部署注意

- 网站使用 history 路由（`/article/1` 这类地址），托管平台需支持 SPA 回退（把不存在的路径重定向到 `index.html`）。`vite preview` 和本项目后端都已内置该回退。
- 静态站点默认部署在域名根路径（`vite.config.js` 的 `base` 默认 `/`）；部署到子目录需调整 `base`。
- 公网静态站是只读快照：浏览、搜索、问答可用；后台管理只在本机使用。

## 目录结构

```
LZH_WINE/
├── src/                  # 前端源码
│   ├── content/          # 内容源文件（文章 md、分类、题库）
│   ├── stores/           # Pinia 状态
│   ├── views/            # 页面
│   └── router/           # 路由
├── server/               # 后端（Express + SQLite）
│   ├── index.js          # 入口
│   ├── db.js             # 数据库与种子数据
│   ├── export.js         # 数据库 → 内容源文件
│   └── import.js         # 内容源文件 → 数据库
├── public/               # 静态资源
└── index.html
```

## 数据说明

内容采用双数据源设计：本地有后端时，前端从 API 读取实时数据；没有后端时（公网静态站），自动使用打包进构建产物的内容。两者通过 `server/export.js` 和 `server/import.js` 同步。
