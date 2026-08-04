# AGENTS

> 给人类协作者和 AI 编码助手。**开始开发前先读本文件。**

## 项目

个人博客（将开源）。作者关注嵌入式 + AI。两类文字（文章 / 随笔）、项目展柜、匿名留言、一个像素 RPG 风格的互动房间子页面（/room）。

## 三条红线（不可破）

1. **性能优先**：主站静态预渲染，首屏即完整，不依赖客户端渲染或大体积 JS。不要出现"内容一点点加载"。
2. **房间与主站隔离**：互动房间（`/room`，纯 Canvas 2D 像素画）独立路由，脚本只在该路由加载，不进主站 bundle。（历史：曾用 React Three Fiber / 纯 Three.js，因 Astro v6 兼容 + 效果问题改用 Canvas 2D 像素画；旧 `room-scene-3d.ts` 归档保留。）
3. **`local/` 私有**：包含个人规划 / 素材，不开源（已 gitignore）。不要把它的内容写进开源代码或提交。

## 技术栈

Astro（静态优先，零 React）· 纯 Canvas 2D 像素画房间（`room-pixel.ts`）· 手写 CSS + CSS 变量 · Press Start 2P 像素字体 · content collections · Waline（留言，待定）

## 像素风格指南

主站走「像素外壳 + 正文可读」路线——与 `/room` 的全像素画同世界观，但不牺牲双语可读性。

**像素字体（Press Start 2P，OFL）**
- 只用在拉丁字母 / 数字：logo、卡片编号、英文标签、状态徽章。
- **绝不用在中文正文**（该字体不含 CJK，会回退系统字体，不协调）；中文 / 正文用系统字体栈。
- 走 `var(--font-pixel)`。当前是 Google Fonts 链接，**正式上线前应自托管 woff2 + preload**（红线 #1）。详见 `local/notes/自托管字体.md`。

**像素外壳（chrome）**
- 卡片 / 按钮 / 标签：`border-radius: 0` + 2px 描边 + 像素四角小方块点缀；胶囊圆角一律改直角。
- hover：描边变强调色 + 微发光（纯 CSS）。
- 分割线 / 标题前缀用像素块、像素虚线（`repeating-linear-gradient`）。

**像素画绘制（Canvas 2D，参考 `src/scripts/room-pixel.ts`）**
- 基础工具：`px(ctx,x,y,w,h,color)`、`adj(hex,amt)` 调亮暗、`pal(isDay)` 调色板。
- 逻辑低分辨率画布（480×300）+ CSS `image-rendering: pixelated` 放大，保硬边像素。
- 黑描边、高饱和、强投影、3/4 俯视、按 y 排序分层。
- 昼夜：`classList.contains('light')` → 亮色主题 = 白天。
- 可交互物体各自独立分层 + 独立 hitbox，像游戏素材一样可点。

**调色板**：沿用 CSS 变量。主强调琥珀 `#E8B166`；次强调青 `#7DD3C0`（随笔 / 房间屏幕光）；像素画内还用红 `#D02828` / 蓝 `#2848D0`（机器人装甲）等。

**禁止**：像素字体压在中文正文上、平面贴纸 / icon 拼贴式房间、胶囊圆角标签、为炫而炫的动效。

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
- [`develplan/design.md`](./develplan/design.md) — 性能预算、房间隔离、像素视觉调性
- [`develplan/structure.md`](./develplan/structure.md) — 路由、内容模型、frontmatter
- [`develplan/deployment.md`](./develplan/deployment.md) — 部署、域名迁移（site/base 走环境变量）
- [`develplan/roadmap.md`](./develplan/roadmap.md) — 分阶段搭建路线
- [`develplan/decisions.md`](./develplan/decisions.md) — 已定 / 待定 / 实现顺序

## 工作约定

- 改架构 / 技术栈 / 性能相关项前，先看 `develplan/decisions.md` 并与作者确认。
- 动效必须有用途，不为炫而炫（见 develplan/design.md）。
- 写组件前先看是否已有可复用的。
- 做像素风 UI 前，先看本文件「像素风格指南」，保持全站一致。
- `local/` 下的内容是参考素材，不原样搬进开源代码。
