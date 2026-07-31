# 部署 · GitHub Pages → 自有域名

## 目标

1. 先部署到 GitHub Pages。
2. 之后迁到自有域名。

**硬要求**：迁移时只改配置，不改代码里的任何路径。

## 核心原理：为什么路径要小心

GitHub Pages 的 URL 形态取决于仓库名：

| 仓库名 | 部署地址 | base 前缀 |
|---|---|---|
| `用户名.github.io`（特殊仓库名） | `https://用户名.github.io/` | `/`（根路径） |
| 普通仓库名（如 `blog`） | `https://用户名.github.io/blog/` | `/blog/` |
| 自有域名（任意仓库名 + CNAME） | `https://你的域名/` | `/`（根路径） |

base 不对的话，所有 CSS / JS / 图片 / 内部链接都会 404。

## 设计：site 与 base 走环境变量

把 `site`（域名）和 `base`（路径前缀）从代码里抽出来，用环境变量驱动。切换部署目标只改环境变量，代码和 workflow 都不动。

### astro.config.mjs（初始化后照此配置）

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL,           // 完整站点地址，如 https://learnerCodeZ.github.io
  base: process.env.BASE_PATH ?? '/',   // 普通仓库填 '/repo/'，其余填 '/'
  // ... 其它配置
});
```

### GitHub Actions 用仓库 Variables 传入

在 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 里配两个变量：

- `SITE_URL`：如 `https://learnerCodeZ.github.io`（迁域名时改成 `https://你的域名`）
- `BASE_PATH`：`/`（或普通仓库的 `/repo/`）

workflow 里透传给构建：

```yaml
- uses: withastro/action@v0
  env:
    SITE_URL: ${{ vars.SITE_URL }}
    BASE_PATH: ${{ vars.BASE_PATH }}
```

切换部署目标时，只改这两个 Variable，重新触发部署即可。

## 资源 / 链接规则（必须遵守，否则迁移会 404）

这是迁移能否"零改代码"的关键。写代码时务必：

- **内部链接**：用 `<a href="/about">`、`/articles/...`。Astro 会自动拼上 `base`。
  - ✅ `href="/about"`
  - ❌ `href="/blog/about"`（硬编码前缀）
  - ❌ `href="https://learnerCodeZ.github.io/about"`（硬编码域名）
- **图片**：放 `src/assets/` 用 `import` 引入（Astro 自动优化 + 拼路径），或放 `public/` 用 `/img/x.png` 引用。不要写带域名或前缀的绝对路径。
- **绝对 URL**（sitemap、RSS、og:url、canonical link）：用 `new URL(path, Astro.site)` 拼接，不要写死域名。
- **资源 import**：用相对路径 import，不要 `/public/...`。

## 推荐：用 `用户名.github.io` 仓库

最省心的路径——Pages 部署在根路径，`BASE_PATH='/'`，迁自有域名时几乎零成本（只改 `SITE_URL` + DNS + CNAME）。

如果必须用普通仓库名，就用上面的 `BASE_PATH='/repo/'` 方案，规则一样。

## GitHub Actions 部署 workflow（参考）

放到 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v0
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          BASE_PATH: ${{ vars.BASE_PATH }}
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

仓库 **Settings → Pages → Source** 选 "GitHub Actions"。

## 迁移到自有域名的清单

代码路径无需改动，只做下面几步：

1. **加 CNAME 文件**：在 `public/CNAME` 写上你的域名（如 `blog.yourname.com`）。Astro 会原样发布到根目录。
2. **DNS 配置**（二选一）：
   - 子域名：`CNAME` 记录，`blog` → `用户名.github.io`
   - 顶点域名：`A` 记录指向 GitHub Pages 的 IP（见 GitHub 官方列表）
3. **改 SITE_URL Variable**：GitHub 仓库 Variables 里把 `SITE_URL` 改成 `https://你的域名`，`BASE_PATH` 保持 `/`。
4. **GitHub 设置**：Settings → Pages → Custom domain 填域名，勾 Enforce HTTPS。
5. 等其生效（DNS 传播几分钟到几小时）。重新触发一次部署。

完成后 `https://你的域名` 即是站点，旧 `用户名.github.io` 地址会自动跳转过去。