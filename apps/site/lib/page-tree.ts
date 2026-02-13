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
      children: [{ type: 'page', name: 'Installation', url: '/docs/getting-started/installation' }],
    },
    {
      type: 'folder',
      name: 'Guide',
      index: {
        type: 'page',
        name: 'Overview',
        url: '/docs/guide',
      },
      children: [
        { type: 'page', name: 'Architecture', url: '/docs/guide/architecture' },
        { type: 'page', name: 'Platform Components', url: '/docs/guide/platform-components' },
        { type: 'page', name: 'Data Modeling', url: '/docs/guide/data-modeling' },
        { type: 'page', name: 'Security Guide', url: '/docs/guide/security-guide' },
        { type: 'page', name: 'SDK Reference', url: '/docs/guide/sdk-reference' },
        { type: 'page', name: 'Logic Hooks', url: '/docs/guide/logic-hooks' },
        { type: 'page', name: 'Logic Actions', url: '/docs/guide/logic-actions' },
        { type: 'page', name: 'UI Framework', url: '/docs/guide/ui-framework' },
        { type: 'page', name: 'Development Plan', url: '/docs/guide/development-plan' },
        { type: 'page', name: 'Contributing', url: '/docs/guide/contributing-development' },
      ],
    },
    {
      type: 'folder',
      name: 'Specifications',
      index: {
        type: 'page',
        name: 'Overview',
        url: '/docs/spec',
      },
      children: [
        { type: 'page', name: 'Metadata Format', url: '/docs/spec/metadata-format' },
        { type: 'page', name: 'Query Language', url: '/docs/spec/query-language' },
        { type: 'page', name: 'HTTP Protocol', url: '/docs/spec/http-protocol' },
      ],
    },
  ],
};
