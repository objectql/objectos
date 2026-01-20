import type { Root } from 'fumadocs-core/page-tree';

// Build page tree from docs and meta for navigation
export const pageTree: Root = {
  name: 'Documentation',
  children: [
    {
      type: 'folder',
      name: 'Getting Started',
      index: {
        type: 'page',
        name: 'Introduction',
        url: '/docs/getting-started',
      },
      children: [
        { type: 'page', name: 'Installation', url: '/docs/getting-started/installation' },
      ],
    },
  ],
};
