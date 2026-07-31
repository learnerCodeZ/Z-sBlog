# Z'sBlog

> 个人博客 · 关注嵌入式与 AI，记录折腾、复盘与想法。

首页 hero 定位文案待定。

## 这个博客要做成什么样

- **静态优先，性能是硬约束**：打开即完整内容，不存在"一点点加载"的卡顿感。
- **两类文字**：**文章**（技术复盘，带标签 / 阅读时长）与 **随笔**（散文 / 反思）。
- **项目展柜**：带状态徽章（进行中 / 维护中 / 归档）。
- **匿名留言**：访客无需登录即可留言。
- **3D 子页面**：一个独立的互动小空间，独立路由、懒加载，绝不拖慢主站。
- **关于我**：含我感兴趣的方向。

## 技术栈

| 用途 | 选型 | 说明 |
|---|---|---|
| 站点框架 | **Astro** | 静态优先、默认零 JS；性能约束下的首选 |
| UI 交互 | React（Astro islands） | 仅在需要交互的组件按需 hydrate |
| 3D | React Three Fiber + drei | 独立路由懒加载 |
| 动效 | framer motion（克制使用） | 仅 hero / 卡片等点睛处 |
| 样式 | 手写 CSS + CSS 变量 | 轻量、零依赖、亮暗用变量切换 |
| 内容模型 | Astro content collections | 文章 / 随笔 双集合 |
| 评论 | Waline（待定） | 可匿名、国内友好 |
| 搜索 | Pagefind | 纯静态、构建期生成 |
| 部署 | GitHub Pages → 自有域名 | 见 [`develplan/deployment.md`](./develplan/deployment.md) |

> 视觉调性尚未最终拍板，但不影响以上结构选型。详见 [`develplan/design.md`](./develplan/design.md)。

## 快速开始

> 项目尚未初始化。初始化后命令如下（占位）：

```bash
npm install
npm run dev        # 本地开发
npm run build      # 构建静态站点到 dist/
npm run preview    # 预览构建产物
```

## 目录结构（规划）

```
Z'sBlog/
├── src/
│   ├── pages/            # 路由：首页 / 文章 / 随笔 / 项目 / 关于 / 留言 / 3D房间
│   ├── content/          # content collections
│   │   ├── articles/     # 文章（技术）
│   │   └── essays/       # 随笔（散文）
│   ├── components/       # 组件
│   ├── layouts/          # 布局
│   └── styles/           # 全局样式
├── public/               # 静态资源
├── develplan/            # 开发计划：设计 / 结构 / 部署 / 决策
├── AGENTS.md             # 给 AI 协作者的项目契约
├── local/                # 私有规划 / 素材（已 gitignore，不开源）
└── README.md
```

## 与 AI 协作者一起开发

本仓库会与 AI 编码助手协作开发。**开始任何开发前，请先读 [`AGENTS.md`](./AGENTS.md)**，详细计划在 [`develplan/`](./develplan)。

## License

待定（将开源）。
