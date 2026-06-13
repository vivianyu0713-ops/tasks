# 个人工作台

一个面向个人使用的工作任务管理平台。当前版本聚焦：

- 统一收集箱
- 分类工作池：需求、线上问题、逻辑答疑、日常待办、不承接
- 核心字段：提出人、问题描述、对接人、提出时间、预期解决时间、结论
- 需求表格视图和按状态看板视图
- 事项详情抽屉，可修改所属事项和分类专属字段
- Supabase Postgres 真实数据库存储
- Next.js API Routes 后端读写数据库
- 暂不做登录

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：

复制 `.env.example` 到 `.env`，填写：

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-secret-key"
```

`SUPABASE_SECRET_KEY` 只能放在本地 `.env` 或 Vercel 环境变量中，不要提交到 GitHub。

3. 确认 Supabase 已创建 `work_items` 表。

4. 启动本地预览：

```bash
npm run dev
```

打开 `http://localhost:3000`。

页面会通过 `/api/work-items` 调用 Next.js 后端接口，再由服务端通过 Supabase HTTPS API 读写 `work_items` 表。

当前为了兼容已创建的 `work_items` 表，需求、线上问题、逻辑答疑的专属字段会由服务端打包存储在 `description` 字段中，并在 API 返回时解析成结构化字段。后续稳定后可以再迁移成独立数据库列或详情表。

## 常用命令

```bash
npm run lint
npm run build
```

## Vercel 部署

部署到 Vercel 后，需要在：

```text
Project Settings -> Environment Variables
```

配置同样的变量：

```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
```

GitHub 仓库只提交 `.env.example`，不要提交 `.env`。

## 安全提醒

当前版本没有登录。如果部署到公网，知道链接的人可以访问页面并操作数据。正式长期使用前，建议补个人访问密码、Supabase Auth 或 Vercel Deployment Protection。

数据库密钥只在服务端使用：

```text
浏览器
  -> Next.js API
  -> Supabase HTTPS API
  -> Supabase Postgres
```

浏览器不会直接拿到 `SUPABASE_SECRET_KEY`。

## 后续方向

- 增加登录或访问码
- 增加业务环节复盘统计
- 增加公开提交入口
- 增加 AI 分类和月度复盘
