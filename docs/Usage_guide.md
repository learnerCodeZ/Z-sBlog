# 使用指南

> 本地开发、写内容、自定义、部署的完整操作手册。项目简介看 [README](../README.md)，本文档讲"怎么用"。

## 一、环境要求

- **Node.js 18+**（推荐 20+；本项目开发用 24.x）
- **npm**（随 Node 自带）

检查：

```bash
node -v
npm -v
```

## 二、快速开始

```bash
# 1. 安装依赖（首次，或拉取新代码后）
npm install

# 2. 启动开发服务器
npm run dev
```

看到 `Local: http://localhost:4321/` 后，浏览器打开即可。改代码会自动刷新。

## 三、命令一览

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（写代码时用，热更新） |
| `npm run build` | 构建静态站点到 `dist/`（部署前用） |
| `npm run preview` | 本地预览 build 后的产物 |
| `npm run astro` | 直接调用 Astro CLI（如 `npm run astro -- --help`） |

**停止开发服务器**：在该终端按 `Ctrl + C`。

## 四、目录结构

```
src/
├── pages/              # 路由（每个文件 = 一个页面）
│   ├── index.astro         # 首页
│   ├── blog/               # 博客（列表 + 详情，含 tab 筛选）
│   ├── projects.astro      # 项目
│   ├── about.astro         # 关于
│   ├── guestbook.astro     # 留言
│   └── room.astro          # 3D 房间（待做）
├── content/            # 你的博客内容（markdown）
│   └── posts/              # 文章 + 随笔都在这，用 type 区分
├── components/         # 组件（导航、图标、主题切换）
├── layouts/Base.astro  # 全站布局
├── data/site.ts        # 站点配置（社交链接、导航项）
└── styles/global.css   # 全局样式 + 配色变量
```

详细架构与设计决策见 [`develplan/`](../develplan)。

## 五、写内容

文章和随笔都放在 `src/content/posts/`，用 frontmatter 的 `type` 字段区分。

### 写一篇文章

在 `src/content/posts/` 新建一个 `.md` 文件（如 `hololens-align.md`）：

```markdown
---
title: "Hololens 坐标系对齐记"
date: 2026-07-28
type: article
tags: ["Hololens", "ROS"]
summary: "卡了三周的坑，以及为什么。"
---

正文用 Markdown 写……
```

它会自动出现在 `/blog` 列表，详情页地址是 `/blog/hololens-align`。

### 写一篇随笔

同样在 `src/content/posts/` 新建 `.md`，把 `type` 设为 `essay`（不需要 tags）：

```markdown
---
title: "信息茧房与视野"
date: 2026-07-15
type: essay
summary: "一点想法。"
---

正文……
```

### frontmatter 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `date` | 是 | 发布日期（如 `2026-07-28`） |
| `type` | 是 | `article`（文章）或 `essay`（随笔） |
| `tags` | 否 | 标签数组，文章常用 |
| `summary` | 否 | 摘要（列表 / SEO 用） |
| `draft` | 否 | `true` 时不显示、不生成页面（草稿） |

> **文件名即 URL**。用英文或拼音 + 短横线命名（`my-post.md` → `/blog/my-post`），避免中文和空格。

## 六、自定义

### 改社交链接（GitHub / Bilibili）

编辑 [`src/data/site.ts`](../src/data/site.ts)：

```ts
social: {
  github: 'https://github.com/你的用户名',
  bilibili: 'https://space.bilibili.com/你的ID',
},
```

### 改导航项

同文件 `src/data/site.ts` 里的 `NAV_LINKS`。

### 改首页 hero（标语 / 介绍）

编辑 [`src/pages/index.astro`](../src/pages/index.astro) 里的 `.meta`、`.display`、`.intro` 三段。

### 改配色

所有颜色都是 CSS 变量，集中在 [`src/styles/global.css`](../src/styles/global.css)：

```css
:root {
  --color-bg: #0e0f11;        /* 背景 */
  --color-accent: #e8b166;    /* 主强调色（琥珀） */
  /* 改这里，全站跟着变 */
}

:root.light,
html.light {
  /* 亮色模式的覆盖值 */
}
```

### 亮暗模式

- **默认暗色**。
- 右上角太阳 / 月亮按钮切换，选择记在 `localStorage`，刷新不丢、不闪。
- 想把默认改成亮色：调整 [`src/layouts/Base.astro`](../src/layouts/Base.astro) 的初始化脚本和 `global.css` 的变量默认值。

## 七、部署

部署到 GitHub Pages（之后再迁自有域名）的完整方案见 [`develplan/deployment.md`](../develplan/deployment.md)。要点：

- 构建产物在 `dist/`。
- 站点域名和路径前缀走环境变量 `SITE_URL` / `BASE_PATH`（**不写死在代码里**，迁移只改环境变量）。
- GitHub Actions 自动部署配置在 `.github/workflows/deploy.yml`。

## 八、常见问题

**Q：启动时报端口 4321 被占用？**
有另一个 dev server 还在跑。停掉它，或换个端口启动：

```bash
npm run dev -- --port 4322
```

**Q：写了文章但列表里看不到？**
检查 frontmatter 里 `draft` 是不是 `true`（草稿不显示），或 `date` 格式写错了。

**Q：Astro 提示 Vite 版本警告？**
非致命，能正常跑。想消除，在 `package.json` 加：

```json
"overrides": { "vite": "^7" }
```

然后重新 `npm install`。

**Q：改了 `astro.config.mjs` 不生效？**
配置改动需要重启 dev server（`Ctrl + C` 后重新 `npm run dev`）。

## 九、文档导航

| 想了解 | 看这里 |
|---|---|
| 项目是什么 / 技术栈 | [README](../README.md) |
| 给 AI 协作者的规矩 | [AGENTS.md](../AGENTS.md) |
| 设计 / 配色 / 性能预算 | [develplan/design.md](../develplan/design.md) |
| 页面结构 / 内容模型 | [develplan/structure.md](../develplan/structure.md) |
| 部署 / 域名迁移 | [develplan/deployment.md](../develplan/deployment.md) |
| 搭建路线图 | [develplan/roadmap.md](../develplan/roadmap.md) |
| 已定 / 待定决策 | [develplan/decisions.md](../develplan/decisions.md) |
