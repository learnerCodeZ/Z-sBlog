# 设计 · 性能 · 动效

## 性能预算（硬约束）

作者明确要求：**页面不能卡，不能出现"内容一点点加载"的体验。**

规则：

- 主站页面 **静态预渲染**（SSG）。打开即完整 HTML，不依赖客户端 fetch 拼内容。
- 首屏 JS 预算：尽量为 0。交互组件用 Astro islands 按需 hydrate（优先 `client:visible` / `client:idle`，**避免 `client:load`** 拖首屏）。
- 房间 / Three.js 资源 **绝不** 进入主站 bundle——见下"房间隔离"。
- 图片：用 Astro 内置 `<Image>`，自动 webp/avif + 正确尺寸 + 懒加载。禁止首屏放未优化的原图。
- 字体：子集化 + `font-display: swap`，或用系统字体栈。
- 动效：CSS 优先；JS 动效（framer motion）只用在 hero / 卡片等少数点睛处。

## 房间隔离（硬约束）

互动房间子页面（路由 `/room`）：

- **独立路由**。房间脚本（`src/scripts/room-pixel.ts`，纯 Canvas 2D 像素画）只在该路由加载。
- 主站（首页、文章、项目等）**不得 import** 房间模块 / three.js。
- 旧 Three.js 实现（`room-scene-3d.ts`）已归档保留，不再接入页面；若复用，注意不要进主站 bundle。
- 进入子页面时可显示轻量骨架 / 进度，但主站不能背这个成本。

## 视觉调性（已定）

**克制的暗色阅读站 + 像素 RPG 外壳。** 底子是安静的暗色阅读站（带点"工作站"温度），表层套一层像素游戏风（像素字体 logo、直角描边卡片、像素分割线）——与 `/room` 的全像素画同世界观。原则：像素只做"外壳"（chrome），正文保持清晰可读（尤其中文）。详见 `AGENTS.md`「像素风格指南」。

### 配色

暗色（默认）：

| 用途 | 色值 |
|---|---|
| 背景 | `#0E0F11` |
| 卡片 / 代码块 | `#17181B` |
| 边框 | `#26282D` |
| 正文 | `#E9E7E1` |
| 次要文字 | `#9B998F` |
| 主强调（琥珀） | `#E8B166` |
| 次强调（随笔 / 房间屏幕光） | `#7DD3C0` |

亮色：

| 用途 | 色值 |
|---|---|
| 背景 | `#FAFAF7` |
| 卡片 | `#F2F1EC` |
| 边框 | `#E2E1DA` |
| 正文 | `#1C1C1A` |
| 次要文字 | `#6B6A63` |
| 主强调 | `#C8881F`（琥珀调深，保证对比度） |

实现：颜色全部走 CSS 变量（`:root` 暗色，`.light` 覆盖亮色），**默认暗色**，切换按钮记 `localStorage`，并在 `<html>` 上加 class 防闪烁（inline script 在 head 先跑）。

### 字体

- 中文 / 正文：系统字体栈（`PingFang SC` / `Microsoft YaHei`），零下载、零外部依赖。
- 像素字体：`Press Start 2P`（OFL），只用在 logo / 编号 / 英文标签等拉丁字符处。**不含中文，禁止压在中文正文上。**（早期计划过 Fraunces / JetBrains Mono，未采用。）
- 当前像素字体走 Google Fonts 链接，**上线前应自托管 woff2 + preload**（见性能红线）。详见 `local/notes/自托管字体.md`。

### 布局要点

- **导航**：左 logo，右 = 导航链接 + GitHub/Bilibili icon + 亮暗切换按钮。
- **首页**：hero（定位 + 座右铭）→ 最新文章/随笔（左对齐时间轴式）→ 精选项目（卡片 + 状态徽章）。
- 文章正文 `max-width ~70ch`，行高 1.7。
- 文章列表用时间轴式（日期左、标题右）；项目用卡片。

### 动效（克制）

- **动**：hero 标题逐行渐入（一次性）、卡片 hover 微浮（纯 CSS）、链接下划线滑入、Astro view transitions。
- **不动**：粒子、视差、3D 滚动、全场 fade。

> 像素风已从 /room 延伸到主站外壳；但正文（尤其中文）必须清晰可读，不为像素牺牲内容。

## 设计资源（作者收集）

见 `local/assets/`（私有，不开源）：

- UI 库：MagicUI、Aceternity、cult-ui
- 动效：framer motion
- 3D：Three.js
- 灵感：awwwards
- 参考博客：谢懿 futseyi.com、Bryce Ikeda、周炯宇 torosamy.net、蔡 karicms.github.io、陈文轩 xingqiwu.net.cn

引用第三方资源时注意 license。

## 未来可探索（暂不做）

- **Linux / 终端指令风格元素**：作者想以后融入一些 shell / 终端指令的视觉元素（如 `$ whoami`、命令行提示符、终端式排版等）。等主站内容与基础视觉稳定后再加，避免过早增加复杂度。
