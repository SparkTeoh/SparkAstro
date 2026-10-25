import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Markdown 文章：放在 src/content/blog/*.md
// .astro 富媒体文章不走 collection，直接放在 src/pages/blog/<slug>.astro 并 export const blogData
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Spark Liang'),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    type: z.string().default('文章'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// 我的清单：每个清单一个 YAML 文件，放在 src/content/stacks/<slug>.yaml，网址是 /stack/<slug>
// 产品照片放在 src/content/stacks/<slug>/ 里，YAML 里用相对路径引用，例如 image: ./hair/nizoral.jpg
const stacks = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/stacks' }),
  schema: ({ image }) => {
    const item = z.object({
      id: z.string().regex(/^[a-z0-9-]+$/, 'id 只能用小写英文、数字和 -，会成为单项链接 #id'),
      name: z.string(),
      alias: z.string().optional(),          // 外号，例如 The Blocker
      status: z.enum(['必备', '进阶', '可选', '计划入手', '已淘汰']).default('必备'),
      image: image().optional(),             // 产品照片（没有照片时显示 icon 图标）
      icon: z.enum(['dropper', 'foam', 'shampoo', 'bottle', 'tube', 'pump', 'mask', 'patch', 'helmet', 'stamp', 'clinic']).optional(),
      role: z.string(),                      // 一句话：它负责什么
      why: z.string(),                       // 为什么选这一款
      how: z.string(),                       // 我怎么用
      price: z.string().optional(),          // 价位，例如 RM 80–120
      since: z.string().optional(),          // 用了多久，例如 2 年
      link: z.string().url().optional(),     // 购买或官网链接
      affiliate: z.boolean().default(false), // 链接是否带佣金
    });

    const layer = z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string(),                      // 第一层：阻断 DHT
      metaphor: z.string().optional(),       // 比喻：治土壤
      explain: z.array(z.string()).default([]),   // 原理，一段一项
      options: z
        .array(z.object({ name: z.string(), pros: z.string(), cons: z.string(), mine: z.boolean().default(false) }))
        .default([]),                        // 有哪些选择
      mine: z.string().optional(),           // 我的情况 / 我为什么这样选
      fit: z.string().optional(),            // 适合谁
      skip: z.string().optional(),           // 谁不需要
      items: z.array(item).default([]),
    });

    return z.object({
      title: z.string(),                     // 页面标题：我的生发清单
      short: z.string(),                     // 卡片短名：生发
      tagline: z.string(),
      intro: z.string(),
      updated: z.coerce.date(),
      order: z.number().default(99),
      draft: z.boolean().default(false),
      medical: z.boolean().default(false),   // true 时显示医疗免责声明
      safety: z.array(z.string()).default([]),
      priceNote: z.string().optional(),      // 价格说明，例如查价日期
      science: z
        .object({
          title: z.string(),
          flow: z.array(z.string()).default([]),       // 原理流程图，一步一项
          paragraphs: z.array(z.string()).default([]),
          analogy: z.object({ title: z.string(), text: z.string() }).optional(),
          // 补充说明：例如「那植发呢？」，左栏讲好处，右栏讲为什么还不够
          aside: z
            .object({
              title: z.string(),
              lead: z.string().optional(),
              pros: z.object({ title: z.string(), points: z.array(z.object({ title: z.string(), text: z.string() })) }),
              cons: z.object({ title: z.string(), points: z.array(z.object({ title: z.string(), text: z.string() })) }),
              conclusion: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      // 脸部重点区域图（护肤清单用）：products 填产品 id，会自动变成链接
      zones: z
        .object({
          title: z.string(),
          intro: z.string().optional(),
          areas: z.array(
            z.object({
              id: z.enum(['u', 'temple', 't', 'eye', 'all']),
              level: z.enum(['focus', 'light']).default('focus'),
              label: z.string(),
              tag: z.string(),
              note: z.string(),
              products: z.array(z.string()).default([]),
            }),
          ),
        })
        .optional(),
      groups: z.array(layer),
      principles: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
      schedule: z
        .object({
          title: z.string(),
          rows: z.array(z.object({ label: z.string(), days: z.array(z.string()).length(7) })),
          highlight: z.array(z.string()).default([]),  // 包含这些字的格子用蓝色标出
          note: z.string().optional(),
        })
        .optional(),
      notRecommended: z.array(z.object({ name: z.string(), reason: z.string() })).default([]),
      faq: z.array(z.object({ title: z.string(), description: z.string() })).default([]),
      relatedTag: z.string().optional(),
    });
  },
});

export const collections = { blog, stacks };
