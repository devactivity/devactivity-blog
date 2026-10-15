import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    no: z.string().optional(),
    lang: z.enum(['en', 'id']).default('en'),
    // Video embeds (IDs only, no full URLs needed)
    youtubeId: z.string().optional(),
    tiktokId: z.string().optional(),
  }),
});

export const collections = { blog };
