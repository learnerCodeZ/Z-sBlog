# 决策日志

> 已定 vs 待定。改动架构 / 技术栈 / 性能相关项前，先来这里看，并与作者确认后再更新。

## 已定

- **框架：Astro**（理由：静态优先、默认零 JS，满足性能硬约束）。
- **两类内容：文章 / 随笔**，用 content collections 分开。
- **3D 子页面独立路由 + 懒加载**，与主站 bundle 物理隔离。
- **样式：手写 CSS + CSS 变量**（不用 Tailwind——设计本就是变量驱动的，手写更轻、无版本兼容负担）。
- **内容架构**：文章和随笔合并为单一 `posts` collection（`src/content/posts/`），用 frontmatter `type`（`article` / `essay`）区分。父级导航"博客"（`/blog`），列表带 全部 / 文章 / 随笔 tab 筛选。
- **`local/` 不开源**（私有规划 / 素材），已加入 `.gitignore`。
- **部署路线**：✅ 已上线 GitHub Pages（learnerCodeZ.github.io/Z-sBlog），后迁自有域名。`site` / `base` 走环境变量（SITE_URL / BASE_PATH vars），Node 22 构建。workflow：`.github/workflows/deploy.yml`（自建 Node 构建，非 withastro/action——后者依赖弃用的 upload-artifact v3）。

## 待定（Do not auto-decide）

- **视觉调性**：极简 / 终端 / 动效派 之间的取舍。→ 见 `design.md`，作者要求"回头再商量"。
- **3D 子页面的具体设计**：场景内容、交互、风格。→ 作者说"到时候再具体商量"。
- **首页 hero 文案 / 一句话定位**。
- **评论系统最终选型**（Waline / Artalk / 其他）。建议 Waline。
- **GitHub 仓库策略**：用 `learnerCodeZ.github.io`（根路径，最省心，推荐）还是普通仓库名（带子路径）。（用户名已定：learnerCodeZ）
- **自有域名**：具体域名。
- **License**。
- **暗色 / 亮色** 是否都做、默认哪个。
- **是否做** 站内搜索（Pagefind）、RSS、标签页、sitemap、OG 图（建议都做，待确认）。

## 实现顺序

见 [roadmap.md](./roadmap.md) —— 分 7 个阶段（地基 → 内容 → 门面 → 标配 → 视觉 → 3D → 域名），每阶段都有完成标准。
