# AGENTS

> 给人类协作者和 AI 编码助手。**开始开发前先读本文件。**

## 项目

个人博客（将开源）。作者关注嵌入式 + AI。两类文字（文章 / 随笔）、项目展柜、匿名留言、一个独立的 3D 子页面。

## 三条红线（不可破）

1. **性能优先**：主站静态预渲染，首屏即完整，不依赖客户端渲染或大体积 JS。不要出现"内容一点点加载"。
2. **3D 与主站隔离**：3D 子页面（React Three Fiber）独立路由 + 懒加载，资源不进主站 bundle。
3. **`local/` 私有**：包含个人规划 / 素材，不开源（已 gitignore）。不要把它的内容写进开源代码或提交。

## 技术栈

Astro（静态优先）· React islands · React Three Fiber（3D，懒加载）· 手写 CSS + CSS 变量 · content collections · Waline（留言，待定）

## 开发命令

> 项目尚未初始化。初始化后：

```bash
npm run dev        # 本地开发
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 详细计划

设计、结构、决策、路线图都在 [`develplan/`](./develplan)：

- [`develplan/architecture-survey.md`](./develplan/architecture-survey.md) — 市面与朋友站的技术栈调研
- [`develplan/design.md`](./develplan/design.md) — 性能预算、3D 隔离、视觉调性
- [`develplan/structure.md`](./develplan/structure.md) — 路由、内容模型、frontmatter
- [`develplan/deployment.md`](./develplan/deployment.md) — 部署、域名迁移（site/base 走环境变量）
- [`develplan/roadmap.md`](./develplan/roadmap.md) — 分阶段搭建路线
- [`develplan/decisions.md`](./develplan/decisions.md) — 已定 / 待定 / 实现顺序

## 工作约定

- 改架构 / 技术栈 / 性能相关项前，先看 `develplan/decisions.md` 并与作者确认。
- 动效必须有用途，不为炫而炫（见 develplan/design.md）。
- 写组件前先看是否已有可复用的。
- `local/` 下的内容是参考素材，不原样搬进开源代码。
