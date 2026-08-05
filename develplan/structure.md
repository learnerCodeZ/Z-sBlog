# 页面结构与内容模型

## 路由 / 页面

| 路由 | 说明 | 备注 |
|---|---|---|
| `/` | 首页 | hero + 最近（横滚）+ 文章 + 项目 |
| `/about` | 关于我 | 含感兴趣的方向 |
| `/blog` | 博客列表 | 文章 + 随笔统一展示，带 全部/文章/随笔 tab 筛选 |
| `/blog/[slug]` | 博客详情 | 代码高亮、tags、type 标签 |
| `/projects` | 项目展柜 | 带状态徽章（待做） |
| `/guestbook` | 匿名留言 | Waline（Render + GitHub 存储，已上线） |
| `/room` | 3D 子页面 | 独立懒加载，见 design.md |

## 内容模型

**单一 collection**：`posts`（位于 `src/content/posts/`）。文章和随笔都在这里，用 frontmatter 的 `type` 字段区分。

frontmatter 字段：

- `title` *(string, 必填)*
- `date` *(date, 必填)*
- `type` *(enum, 必填)* — `article`（文章）或 `essay`（随笔）
- `tags` *(string[])* — 文章常用，随笔可省
- `summary` *(string)* — 列表 / SEO 用
- `draft` *(boolean)* — `true` 时不显示、不生成页面

> 文章 vs 随笔：文章偏技术复盘（有 tags、代码块）；随笔偏个人反思（排版自由、以日期为主）。两者共属"博客"，用 `type` 区分。

## 项目数据

项目卡建议用数据文件（如 `src/data/projects.ts` 或 yaml），字段：

- `name`、`description`、`tags`、`link`、`status`（`active` | `maintained` | `archived`）

## 命名 / 文件组织

- 页面放 `src/pages/`，组件放 `src/components/`，布局放 `src/layouts/`。
- 组件文件名 PascalCase；页面 / 路由 kebab-case。
- markdown 内容放 `src/content/posts/`，文件名 kebab-case，与 slug 一致。
