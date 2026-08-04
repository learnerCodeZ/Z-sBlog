# 决策日志

> 已定 vs 待定。改动架构 / 技术栈 / 性能相关项前，先来这里看，并与作者确认后再更新。

## 已定

- **框架：Astro**（理由：静态优先、默认零 JS，满足性能硬约束）。
- **两类内容：文章 / 随笔**，用 content collections 分开。
- **互动房间独立路由**（`/room`），与主站 bundle 物理隔离（纯 Canvas 2D 像素画，不再用 Three.js / R3F）。
- **样式：手写 CSS + CSS 变量**（不用 Tailwind——设计本就是变量驱动的，手写更轻、无版本兼容负担）。
- **内容架构**：文章和随笔合并为单一 `posts` collection（`src/content/posts/`），用 frontmatter `type`（`article` / `essay`）区分。父级导航"博客"（`/blog`），列表带 全部 / 文章 / 随笔 tab 筛选。
- **`local/` 不开源**（私有规划 / 素材），已加入 `.gitignore`。
- **部署路线**：✅ 已上线 GitHub Pages（learnerCodeZ.github.io/Z-sBlog），后迁自有域名。`site` / `base` 走环境变量（SITE_URL / BASE_PATH vars），Node 22 构建。workflow：`.github/workflows/deploy.yml`（自建 Node 构建，非 withastro/action——后者依赖弃用的 upload-artifact v3）。
- **视觉调性：像素 RPG 外壳 + 可读正文**（2026-08 定）。主站套像素游戏风外壳（像素字体 logo / 直角描边卡片 / 像素分割线），正文保持系统字体可读。详见 `AGENTS.md`「像素风格指南」、`design.md`。
- **房间设计：俯视 3/4 像素 RPG 房间**（2026-08 完成）。纯 Canvas 2D（`room-pixel.ts`），可点击家具 / 机器人 / 宝箱，昼夜联动。曾试 Three.js / R3F，因兼容 + 效果弃用，旧代码归档。
- **亮 / 暗双主题**：都做，默认暗色；CSS 变量 + `html.light` + `localStorage` + 防闪烁 inline script。

## 待定（Do not auto-decide）

- **首页 hero 文案 / 一句话定位**。
- **评论系统最终选型**（Waline / Artalk / 其他）。建议 Waline。
- **GitHub 仓库策略**：用 `learnerCodeZ.github.io`（根路径，最省心，推荐）还是普通仓库名（带子路径）。（用户名已定：learnerCodeZ）
- **自有域名**：具体域名。
- **License**。
- **是否做** 站内搜索（Pagefind）、RSS、标签页、sitemap、OG 图（建议都做，待确认）。

## 实现顺序

见 [roadmap.md](./roadmap.md) —— 分 7 个阶段（地基 → 内容 → 门面 → 标配 → 视觉 → 3D → 域名），每阶段都有完成标准。
