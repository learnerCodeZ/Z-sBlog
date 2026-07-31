import { defineConfig } from 'astro/config';

// 部署目标走环境变量，保证 GitHub Pages → 自有域名迁移时零改代码。
// 详见 develplan/deployment.md
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  base: process.env.BASE_PATH ?? '/',
});
