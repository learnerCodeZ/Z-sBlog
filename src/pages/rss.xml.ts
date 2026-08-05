import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';

// RSS feed：从 posts collection 生成（排除草稿）。链接含 BASE_URL，保证子路径下也是绝对地址。
export const GET: APIRoute = async (context) => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? 'https://learnerCodeZ.github.io',
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((p) => ({
        title: p.data.title,
        pubDate: p.data.date,
        description: p.data.summary,
        categories: p.data.tags,
        link: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/blog/${p.id}/`,
      })),
    customData: `<language>zh-cn</language>`,
  });
};
