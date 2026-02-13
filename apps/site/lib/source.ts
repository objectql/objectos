import { docs, meta, blog as blogCollection } from '../.source/server';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement } from 'react';

export const source = loader({
  baseUrl: '/docs',
  source: toFumadocsSource(docs, meta),
  icon(icon) {
    if (icon && icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

export const blog = blogCollection.map((post) => ({
  ...post,
  slug: (post as any).info.path.replace(/\.mdx?$/, ''),
  url: `/blog/${(post as any).info.path.replace(/\.mdx?$/, '')}`,
}));
