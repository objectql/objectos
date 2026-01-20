import type { PageTree } from 'fumadocs-core/server';

// Build page tree from docs and meta for navigation
export const pageTree: PageTree.Root = {
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
