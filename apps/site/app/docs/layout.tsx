import { docs } from '../../.source/server';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { pageTree } from '@/lib/page-tree';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: 'ObjectOS',
        url: '/',
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/objectstack-ai/objectos',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
