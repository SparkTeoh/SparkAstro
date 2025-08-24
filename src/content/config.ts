import { defineCollection, z } from 'astro:content';

// 定义博客集合的 schema
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    author: z.string(),
    authImage: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()),
    summary: z.string(),
    type: z.string(),
    featured: z.boolean().optional().default(false)
  })
});

export const collections = {
  'blog': blogCollection
};