# 架构调研：市面博客用什么 · 朋友的站用什么

> 探测时间 2026-07。朋友站的技术栈通过抓取首页 HTML 的 `<meta name="generator">` 和框架指纹实测得到，非猜测。

## 一、市面博客架构的四大流派

### A. 动态 CMS（有数据库、有后台）
代表：WordPress、Ghost、Typecho
- 运行时服务端渲染，内容存数据库。
- 优点：后台管理、评论 / 插件开箱即用，不懂代码也能用。
- 缺点：慢、要服务器、要维护安全、不轻量。
- 适合：非技术博主、重交互站点。**技术博客几乎没人用这套了。**

### B. 静态生成器 SSG（写 markdown → 构建期生成 HTML）← 技术博客绝对主流
代表：Hugo / Hexo / Jekyll / Eleventy / Astro
- 部署到 CDN 或 GitHub Pages，免费、快、安全、内容可版本控制。
- 区别主要在模板生态和构建方式：
  - **Hugo**（Go）：构建最快、主题生态大、模板语言有学习曲线。
  - **Hexo**（Node）：国内曾流行，主题多，但生态老化。
  - **Jekyll**（Ruby）：GitHub Pages 原生支持，老牌但慢。
  - **Eleventy**（JS）：极简，不绑前端框架。
  - **Astro**（JS）：现代，islands 架构，**默认零 JS**，可混用 React/Vue/Svelte 组件。
- 缺点：动态功能（评论 / 搜索）要外接第三方。

### C. 全栈 / 前端框架做静态导出
代表：Next.js / Nuxt / SvelteKit / Remix
- 以应用框架开发，构建时静态导出。
- 优点：组件化、动效、交互自由（React/Vue 全生态）。
- 缺点：默认带运行时 JS，首屏比纯 SSG 重，对纯内容站偏过度。

### D. 文档站框架
代表：VitePress / VuePress / Docusaurus / Nextra
- 偏知识库 / 文档形态，侧边栏导航为主。
- 适合笔记型、教程型站点，不太像"博客"。

## 二、你那几个朋友站（实测）

| 博主 | 站点 | 实测技术栈 | 流派 | 证据 |
|---|---|---|---|---|
| 谢懿 | futseyi.com | **Astro v6.4.4** | 现代 SSG | `<meta generator>` 实锤 |
| 周炯宇 | torosamy.net | **VitePress v1.6.3** | 文档站（Vue） | `<meta generator>` + `data-v-*` 指纹 |
| 蔡明思 | karicms.github.io | **Next.js**（静态导出） | 全栈框架 SSG | `_next/static` 资源路径 |
| Bryce Ikeda | bryceikeda.com | **Hugo 0.89.4** | 传统 SSG | `<meta generator>` 实锤 |
| 陈文轩 | xingqiwu.net.cn | 未能探测 | — | 网络不通；已知 Web 全栈路线，待补 |

### 几个值得注意的点

- **5 个里 4 个是静态生成**（Astro / Hugo / VitePress / Next.js 静态导出），没有一个用动态 CMS。这验证了"技术博客 = 静态"是当下共识。
- **Bryce Ikeda 用的是 Hugo**——这点很反直觉。他那个被很多人当模板抄的极简精致站，背后是 Go 写的老牌 SSG，不是 React 那套。说明"好看"不取决于框架新不新，取决于审美和克制。但 Hugo 的模板语言对你以后要的 3D / React 交互不友好。
- **谢懿（Astro）和蔡明思（Next.js）是两个"现代派"**。区别：蔡明思要做终端交互 + 重 React 组件所以选 Next.js；谢懿偏内容 + 轻量所以选 Astro。**Astro 默认零 JS、更轻，但同样能跑 React 组件（islands）。**
- **周炯宇用 VitePress**——他是把博客当"知识库 / 文档站"做，侧边栏导航为主。这种形态适合教程密集型，不太适合"文章 + 随笔 + 反思"的混血内容。

## 三、对你的结论

1. **静态是对的方向**——你所有参考都在静态阵营，没人走动态 CMS。
2. **Astro 站得住**——在你这群参考里，Astro 是最现代、且唯一能同时满足你两个硬需求的：
   - **性能**（默认零 JS，纯静态输出）→ 你的"不能卡"
   - **React 逃生舱**（islands）→ 你的 3D 子页面和动效
   
   Hugo 做不到后者；Next.js 做到后者但牺牲了前者的轻量。
3. **不用纠结"别人用啥"**——Bryce Ikeda 证明了框架不是决定因素，审美和克制才是。你的差异化在内容（Hololens/AR）和诚实声音，不在框架选型。
