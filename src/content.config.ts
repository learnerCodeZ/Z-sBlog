import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 文章和随笔统一在一个 collection，用 type 字段区分。
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['article', 'essay']),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
    readTime: z.number().optional(),
  }),
});

export const collections = { posts };
