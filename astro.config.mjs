import { defineConfig } from 'astro/config';

// base 必须带 trailing /，否则 Astro 的内部链接 base 处理不完整
const rawBase = process.env.BASE_PATH ?? '/';
const base = rawBase.endsWith('/') ? rawBase : rawBase + '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  base,
});
