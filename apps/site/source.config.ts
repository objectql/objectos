import { defineDocs, defineConfig, defineCollections } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export const blog = defineCollections({
  dir: 'content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string().date().or(z.date()).optional(),
    author: z.string().optional(),
  }),
  type: 'doc',
});

export default defineConfig();
